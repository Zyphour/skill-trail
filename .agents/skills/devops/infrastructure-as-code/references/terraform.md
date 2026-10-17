# Terraform

## Contents
- Layout and state
- Modules and versions
- Reading plans
- The dangerous operations
- Drift and imports
- Testing and validation

## Layout and state

```hcl
terraform {
  required_version = "~> 1.9"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.60" }
  }
  backend "s3" {
    bucket         = "acme-tfstate"
    key            = "prod/network/terraform.tfstate"
    region         = "eu-west-1"
    encrypt        = true
    dynamodb_table = "tfstate-locks"     # locking; without it two applies can race
  }
}
```

**One state file per system per environment.** A single state for everything means a mistake
anywhere can destroy anything, and every apply waits on the same lock.

Keep environments as one module with per-environment `.tfvars`, not copied directories.
Copy-pasted environments diverge, and the divergence is found during an incident.

## Modules and versions

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.13.0"          # pin exactly; ~> lets a minor change behaviour
}
```

Pin provider and module versions and commit `.terraform.lock.hcl`. An unpinned provider means
`init` can pull a new major and change behaviour with no code change of yours.

Extract a module on the third repetition, not the first. Early modularisation produces
indirection that makes plans harder to read for no benefit.

## Reading plans

```bash
terraform plan -out=tfplan
terraform show -json tfplan | jq -r '
  .resource_changes[] | select(.change.actions != ["no-op"]) |
  "\(.change.actions | join(",")) \(.address)"'
terraform apply tfplan          # apply exactly what was reviewed
```

The symbols that matter:

| Symbol | Meaning | Concern |
| --- | --- | --- |
| `+` | create | usually fine |
| `~` | update in place | read the attributes |
| `-/+` | **destroy then create** | **outage or data loss** |
| `-` | destroy | check what depends on it |

Anything showing `-/+` on a database, load balancer, or anything holding data or an address must
stop the apply until you know which attribute forced it. `terraform plan` prints the reason —
`# forces replacement` — next to the attribute.

## The dangerous operations

```hcl
resource "aws_db_instance" "main" {
  deletion_protection = true       # provider-level

  lifecycle {
    prevent_destroy = true         # terraform-level
  }
}
```

Use both. `prevent_destroy` only protects against Terraform; provider-level protection also stops
a console mistake.

Other traps:
- **`count` renumbers.** Removing an element from the middle shifts every index after it, and
  Terraform destroys and recreates them. Use `for_each` with stable keys instead
- **Changing a `for_each` key** destroys and recreates that resource
- **Renaming a resource block** without `moved` destroys the old and creates a new one

```hcl
moved {
  from = aws_instance.web
  to   = aws_instance.frontend
}
```

## Drift and imports

```bash
terraform plan -detailed-exitcode   # 0 = no changes, 2 = drift, 1 = error
```

Run this on a schedule against every environment. Exit code 2 means reality and code disagree —
investigate before your next real change tries to reconcile it.

For resources created outside Terraform, prefer `import` blocks over the CLI command; they are
reviewable in a plan:

```hcl
import {
  to = aws_s3_bucket.logs
  id = "acme-logs-prod"       # or `identity = {...}`; the two are mutually exclusive
}

resource "aws_s3_bucket" "logs" {   # the destination block must exist and match `to`
}
```

`terraform plan -generate-config-out=generated.tf` will write a starting resource block for you.
Read it before keeping it — generated configuration includes every attribute, including ones you
do not want to manage.

Never edit state by hand. Use `state mv`, `state rm`, and `import`, and take a state backup first
— the backend's versioning is what saves you here.

## Testing and validation

```bash
terraform fmt -recursive -check
terraform validate
tflint --recursive
tfsec .                    # or checkov
```

Run all four in CI. `validate` checks syntax and types but not provider behaviour, so it passing
means very little on its own — `plan` is the real check.

For modules with meaningful logic, `terraform test` (1.6+) runs assertions against a real plan or
apply. Worth it for shared modules; overkill for a root configuration.

## Secrets

Never in `.tfvars` committed to the repo, never in outputs without `sensitive = true`. Remember
that **state contains resource attributes in plaintext**, including generated passwords — which
is why the backend must be encrypted and access-controlled like a credential store.
