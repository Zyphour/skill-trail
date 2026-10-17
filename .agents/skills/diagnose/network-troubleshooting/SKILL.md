---
name: network-troubleshooting
description: Diagnoses connectivity problems — timeouts, connection refused, DNS failures, TLS errors, and requests that work from one place but not another. Use this whenever the user cannot reach a service, mentions a timeout or connection refused, has a certificate error, suspects DNS or a firewall, or says something works locally but not in the cluster. For a service that is reachable but slow, use performance-profiling; for reading what the logs say about it, use log-analysis.
license: MIT
---

# Network troubleshooting

Network problems look alike from the application and are entirely different underneath. "Timeout"
could be DNS, routing, a firewall, TLS, or the server being busy, and each has a different fix.

**Work up the stack in order.** Every layer depends on the ones below it, so testing HTTP before
confirming DNS resolves means interpreting a failure that could come from anywhere.

## 1. Read the error precisely — it names the layer

The distinctions here do most of the diagnostic work, and they are routinely conflated:

| Error | What it means | Layer |
| --- | --- | --- |
| **Name resolution failed** | DNS never returned an address | DNS |
| **Connection refused** | Reached the host; nothing listening on that port | TCP, host up |
| **Connection timed out** | No response at all — packets dropped silently | Firewall or routing |
| **Connection reset** | Something actively closed it mid-stream | Server, proxy, or LB |
| **TLS handshake failure** | Connected fine; the certificate exchange failed | TLS |
| **502 / 503 / 504** | You reached a proxy; the problem is behind it | Application |

**Refused and timed out are the most useful pair.** Refused means packets arrived and something
said no, the network path works. Timed out means they vanished, which is almost always a
firewall or security group, because a correctly configured drop rule is silent by design.

**Done when:** you know which layer to start at.

## 2. Resolve the name

```bash
dig +short api.example.com            # what your resolver returns
dig +short api.example.com @1.1.1.1   # what a public resolver returns
```

Different answers mean split-horizon DNS, a stale cache, or an override. Check `/etc/hosts` and
`/etc/resolv.conf` too — a leftover hosts entry is a classic and invisible cause.

In Kubernetes, test the fully qualified name (`svc.namespace.svc.cluster.local`) as well as the
short one; search-domain configuration causes failures that look like the service is missing.

**Done when:** the name resolves to the address you expect, from the machine that is failing.

## 3. Reach the port

```bash
nc -zv api.example.com 443            # is anything listening
curl -sv --connect-timeout 5 https://api.example.com/health
ss -tlnp | grep 8080                  # on the server: is it listening, and on which interface
```

The most common server-side cause: the process is bound to `127.0.0.1` rather than `0.0.0.0`, so
it works locally and refuses everything from outside. `ss -tlnp` shows this immediately.

If it times out rather than refuses, the packets are being dropped — look at security groups,
network policies, and firewall rules, in that order. Check both directions; return traffic is
blocked as often as outbound.

**Done when:** you can open a TCP connection, or you know exactly where it stops.

## 4. Check TLS separately

```bash
openssl s_client -connect api.example.com:443 -servername api.example.com </dev/null
```

Read the output for: expiry dates, the certificate chain (an incomplete chain works in browsers
that cache intermediates and fails in code that does not), and whether the SNI name matches.

Common causes, roughly in order: expired certificate, missing intermediate, hostname mismatch,
a client that does not trust the internal CA, and a protocol version or cipher mismatch after an
upgrade.

**Done when:** the handshake completes and the certificate is valid for the name used.

## 5. Compare a working case against the failing one

This is the highest-yield move and the most skipped. Find something that works and diff it.

- Same request from a different host, network, or pod
- Same host to a different destination
- The same call by IP instead of hostname — isolates DNS in one step
- With and without the proxy or VPN

The difference between the working and failing case is almost always the answer, and it is far
faster than reasoning about the whole path.

**Done when:** you have one variable that distinguishes working from failing.

## 6. Trace the path when it is not local

```bash
mtr -rwc 50 api.example.com     # traceroute + loss over time; better than either alone
curl -w "dns:%{time_namelookup} conn:%{time_connect} tls:%{time_appconnect} ttfb:%{time_starttransfer}\n" -o /dev/null -s https://api.example.com
```

The `curl -w` timing breakdown is the fastest way to attribute latency to a phase — it tells you
whether time went to DNS, TCP, TLS, or the server thinking.

For intermittent problems, run it repeatedly and look at the distribution rather than one sample.

**Done when:** the slow or failing phase is identified.

## In containers and clusters

Extra layers, each with its own failure mode:

- **NetworkPolicy:** default-deny with a missing rule looks exactly like a firewall drop
- **Service and endpoints:** `kubectl get endpoints <svc>`. Empty endpoints means the selector
  matches nothing, and the service silently blackholes
- **Readiness probes:** a failing probe removes the pod from the service, so requests fail with
  no error in the app's own logs
- **DNS policy and search domains**
- **MTU mismatch** on overlay networks — small requests succeed and large ones hang, which is a
  confusing signature worth recognising

## Report

State which layer failed and the evidence, the specific command and its output. Say what you
ruled out as well as what you found; "DNS resolves correctly, TCP connects, TLS fails on an
expired intermediate" is a complete diagnosis, and the ruled-out layers are what stop the next
person repeating your work.
