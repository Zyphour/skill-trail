---
name: code-templating
description: Turns something built once into a reusable template, generator, or starter — extracting what varies, parameterising it, and keeping it from rotting. Use this whenever the user says they keep writing the same thing, wants a boilerplate, starter, cookiecutter, scaffold generator, or code generator, or is copy-pasting a previous project or module as a starting point. For setting up a single new project directly, use project-scaffolding.
license: MIT
---

# Code templating

A template is an abstraction over things that do not exist yet, which makes it the easiest kind
of abstraction to get wrong. Two costs are usually underestimated: templates rot silently while
their generated children live on, and a wrong parameterisation is worse than copy-paste,
because everyone inherits it.

The honest bar: **three real instances before you templatize.** Two examples cannot tell you
what varies — with two, every difference looks essential and every similarity looks universal.
The third instance is what separates them.

## 1. Lay the real instances side by side

Diff them. Literally, not from memory:

```bash
diff -ru project-a/ project-b/ | head -100
```

Sort every difference into one of three piles:

- **Genuinely varies:** the name, the domain type, the endpoint. These become parameters.
- **Accidentally differs:** divergence from copy-paste drift, different dates, one project
  that upgraded and another that did not. These should be **unified**, not parameterised.
- **Identical:** the actual template body.

The second pile is where the value is. Most "differences" between similar projects are drift,
and turning drift into a parameter permanently enshrines a mistake.

**Done when:** every difference is classified, and the accidental ones have a chosen winner.

## 2. Keep the parameter list short

Every parameter is a question the user must answer and a branch you must maintain. A generator
with fifteen prompts is slower than copying a directory.

- **Aim for three to five.** Name, and the two or three things that genuinely change shape.
- **Derive what you can.** Given a project name, compute the package name, the class name, the
  directory — do not ask three times.
- **Default everything defaultable.** The common case should require answering almost nothing.
- **Prefer post-generation edits to options.** Something changed once, right after generation,
  does not need to be a parameter. Generating a sensible default and letting people edit beats
  a flag with two values.

Reject any parameter that switches architecture. `--with-database` producing two structurally
different outputs means you have two templates wearing one name, and both will be undertested.

**Done when:** each parameter is justified by a real difference across your three instances.

## 3. Generate something that works immediately

The generated output must run, build, and pass its own tests before a human touches it. A
template whose output needs three manual fixes is a template nobody trusts, and they will fall
back to copying a real project, which at least works.

Include, generated and working:
- A passing test
- A runnable entry point
- README with the real project name substituted, not `{{name}}`
- Dependency manifest with a lockfile, or the command to produce one

**Done when:** generate → install → test passes with zero manual edits.

## 4. Choose the simplest mechanism that fits

In increasing order of power and cost:

1. **A documented example repo** — no tooling, no rot detection, but honest and zero
   maintenance. Often the right answer.
2. **String-substitution templates** (cookiecutter and friends) — good for structure and names.
3. **A generator script** — when you need real logic, derived values, or conditional files.
4. **A framework CLI plugin** — only if the ecosystem expects it.

Do not build level 3 when level 1 would do. Most internal "boilerplate problems" are solved by
one good example plus a README.

**Done when:** the mechanism matches the complexity you actually have.

## 5. Plan for rot from the start

This is the part that gets skipped, and it is why most internal templates are abandoned.

- **Test the generator in CI.** Generate a project, install it, run its tests — on a schedule,
  not only on change. Dependencies break templates without the template changing.
- **Version the template** and record which version generated each project, in a committed file.
  Without it, nobody can tell what a project inherited.
- **Write down what generated code owes upstream.** Usually: nothing. Say that explicitly, so
  people feel free to edit generated code — a template people are afraid to modify becomes a
  framework by accident.
- **Set an expiry.** If nobody has generated from it in a year, delete it. A stale template
  actively misleads, because it looks like the current recommendation.

**Done when:** CI generates and tests the output, and the version is recorded in the output.

## When not to build a template

Say so plainly in these cases — the alternative is usually better:

- **Fewer than three instances.** Copy the closest one and move on.
- **The shared part is small.** If 80% is bespoke, templating the 20% adds a tool to learn for
  little gain.
- **It is really a library.** Code that is identical everywhere and would benefit from being
  fixed in one place belongs in a package, not a template. Templates copy; libraries share. If
  you would want to push a fix to everyone, you want a library.

That last distinction is the one most worth getting right, and it is decided by a single
question: when this code has a bug, should every user get the fix automatically?
