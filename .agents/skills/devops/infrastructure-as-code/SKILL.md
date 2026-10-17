---
name: infrastructure-as-code
description: Defines and changes cloud infrastructure through version-controlled configuration — Terraform, Pulumi, CloudFormation, Kubernetes manifests. Use this whenever the user is writing infrastructure config, mentions Terraform or IaC, needs to provision cloud resources, is dealing with state drift, or is about to click something into existence in a cloud console. For linting existing config, use code-linting.
license: MIT
---

# Infrastructure as code

The value of IaC is that the configuration is the truth: reviewable, reproducible, and revertible.
That value evaporates the moment someone changes something in the console, because now the code
describes a system that does not exist.

**Every change goes through the code.** No exceptions for "just this once" or "it's urgent" — the
urgent manual fix is precisely how state drifts and how the next change destroys something.

For Terraform specifics — state layout, plan symbols, the operations that force replacement,
drift detection, and imports — read `references/terraform.md`.

## 1. Read the plan, every time

The plan is the review. Never apply without reading it, and never let a pipeline apply without a
human having read it for anything stateful.

```bash
terraform plan -out=tfplan
terraform apply tfplan          # apply exactly what was reviewed
```

Read specifically for:
- **Destroy and replace.** `-/+` means the resource is destroyed and recreated. On a database,
  a load balancer, or anything with an address other systems know, that is an outage
- **Changes you did not expect:** usually drift, or a provider version that changed a default
- **Count changes:** a resource count that moved can renumber everything after it

**Done when:** you can account for every line of the plan.

## 2. Protect state

State is the most dangerous file in the repository. It maps code to real resources, it usually
contains secrets, and losing it means your infrastructure exists with nothing managing it.

- **Remote backend**, with versioning and encryption. Never local, never committed
- **Locking enabled**, so two applies cannot run concurrently
- **Never edit state by hand.** Use the tool's import, move, and remove commands
- **Treat state as sensitive:** it contains generated passwords and connection strings in
  plaintext
- **Separate state per environment.** One state file for production and staging means a mistake
  in one can destroy the other

**Done when:** state is remote, locked, versioned, and access-controlled.

## 3. Separate environments properly

Environments should differ in values, not in code. Copy-pasted directories per environment
diverge, and the divergence is discovered during an incident.

Use one module with per-environment variable files, or workspaces where they fit. Keep production
values in a file that is reviewed more carefully than the others.

**Never point a non-production run at production credentials.** The classic disaster is a staging
apply with production state.

**Done when:** the only difference between environments is a values file.

## 4. Guard the irreversible

- **`prevent_destroy`** on databases, storage buckets, and anything holding data
- **Deletion protection** at the provider level as well — belt and braces, since the lifecycle
  rule only protects against this tool
- **Backups verified** before any change touching stateful resources
- **Know what forces replacement.** Many attributes are immutable, and changing one silently
  means destroy-and-recreate

**Done when:** no plan can destroy data without an explicit, deliberate override.

## 5. Modularise, but not too early

- **Start flat.** A single configuration is easier to read than three layers of module
  indirection
- **Extract a module on the third repetition**, not the first
- **Pin module and provider versions.** An unpinned provider means `init` can pull a new major
  and change behaviour with no code change
- **Keep blast radius small:** separate state per system, so a mistake in one cannot cascade

**Done when:** each abstraction removes real duplication.

## 6. Detect drift before it bites

Run a plan on a schedule against every environment. An empty plan means the code and reality
agree; anything else is drift to investigate.

When drift is found, decide deliberately: adopt it into code, or revert it. Leaving it is how
you get an apply that unexpectedly deletes something someone needed.

**Done when:** drift is detected automatically rather than discovered during a change.

## Report

State what changed, what the plan showed, what was replaced rather than updated, and what remains
manual. Anything still created by hand is a gap in the model, and naming it is more useful than
pretending the code is complete.
