---
name: containerization
description: Packages an application into a container image that is small, reproducible, and safe to run — Dockerfiles, layer caching, multi-stage builds, and runtime configuration. Use this whenever the user is writing a Dockerfile, mentions Docker, container images, image size or build times, or is preparing an application to run in Kubernetes or a container platform. For linting an existing Dockerfile, use code-linting.
license: MIT
---

# Containerization

A container image is a build artifact that should be identical everywhere it runs. Most
Dockerfile problems come from treating it as a virtual machine — installing a shell's worth of
tooling, running as root, and rebuilding the world on every code change.

Three properties to aim for: **small**, **reproducible**, and **least-privileged**.

## 1. Order layers by how often they change

Docker caches per layer and invalidates everything after the first change. Put the stable things
first:

```dockerfile
COPY package.json package-lock.json ./
RUN npm ci                      # cached until dependencies change
COPY . .                        # invalidated on every code change
RUN npm run build
```

Copying source before installing dependencies means a one-line change re-downloads everything.
This single ordering change is usually the largest build-time win available.

Use `.dockerignore` — without it, the build context includes `.git`, `node_modules`, and local
artifacts, which is slow and can leak secrets into the image.

**Done when:** a code-only change does not reinstall dependencies.

## 2. Use multi-stage builds

Build tooling has no business in a runtime image. Compilers, dev dependencies, and test fixtures
add size and attack surface.

```dockerfile
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
USER node
CMD ["node", "dist/server.js"]
```

For compiled languages the runtime stage can often be `distroless` or `scratch` — no shell, no
package manager, almost nothing to exploit.

**Done when:** the runtime image contains only what running requires.

## 3. Pin the base image

- **A specific version tag**, never `latest`. `latest` makes the build non-reproducible and means
  the image you tested is not the one you deploy
- **By digest** for production — a tag can be repointed
- **Prefer slim or distroless variants**, which are smaller and carry far fewer CVEs
- **Rebuild on a schedule** to pick up base image patches. A pinned image is reproducible *and*
  gets stale; both are true and the answer is scheduled rebuilds, not floating tags

**Done when:** the base is pinned and there is a plan for patching it.

## 4. Do not run as root

The default is root, and it is the most common real finding in a container review.

```dockerfile
RUN useradd --system --uid 10001 app
USER app
```

- Use a numeric UID as well as a name, some platforms require it to enforce non-root
- Do not `chown -R` the whole application directory; copy with the right ownership instead
- The container should not need write access to its own code
- Drop capabilities and use a read-only root filesystem where the app allows it

**Done when:** the process runs as a non-root user with no write access it does not need.

## 5. Keep secrets out of the image

Layers are permanent. A secret added in one layer and deleted in the next is still in the image
and readable with `docker history`.

- **Never** put secrets in `ARG`, `ENV`, or a `COPY`'d file
- Use BuildKit secret mounts for build-time credentials
- Inject runtime configuration as environment variables or mounted files, not baked in
- Scan images for embedded credentials before publishing

**Done when:** `docker history` reveals nothing sensitive.

## 6. Configure for the runtime

- **Handle signals.** The process must be PID 1 or have an init that forwards `SIGTERM`, or the
  platform kills it hard on every deploy and in-flight requests are dropped
- **Log to stdout and stderr.** Not to files inside the container
- **Health endpoints:** separate liveness from readiness. Readiness must actually check
  dependencies; liveness must not, or a slow database restarts your app
- **Set resource limits** and make sure the runtime respects them. JVMs and Node need explicit
  configuration to see container memory limits rather than the host's
- **One process per container**, and let the platform handle restarts

**Done when:** the container starts, reports ready accurately, and shuts down cleanly on
`SIGTERM`.

## Report

State the final image size, the base image and how it is pinned, the user it runs as, and what
the build stages separate. Note anything you could not remove from the runtime image and why —
that is the remaining attack surface.
