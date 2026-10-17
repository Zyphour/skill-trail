---
name: disaster-recovery
description: Prepares for and recovers from the failures that lose data or take a whole system down — backups, restore procedures, failover, and recovery objectives. Use this whenever the user mentions backups, disaster recovery, RTO or RPO, failover, or asks what happens if a region or database is lost. Also use when backups exist but have never been restored. For planned schema changes, use data-migration; for a live outage, use incident-response.
license: MIT
---

# Disaster recovery

**A backup you have never restored is not a backup.** It is an untested assumption with a storage
bill, and the number of organisations that discover this during the disaster is the whole reason
this skill exists.

DR is not about having backups. It is about having a *rehearsed* path from a catastrophic state
back to a working one, with known timings.

## 1. Set the two numbers first

Everything else follows from these, and they must come from the business, not from engineering
preference:

- **RPO — recovery point objective.** How much data can you afford to lose? This sets backup
  frequency. Hourly backups mean up to an hour of writes gone
- **RTO — recovery time objective.** How long can you be down? This sets architecture. A
  four-hour RTO permits restore-from-backup; a five-minute RTO requires a warm standby

Set them per system. A payments database and an analytics warehouse do not warrant the same
investment, and pretending otherwise means overspending on one or underspending on the other.

**Done when:** RPO and RTO are agreed in writing by someone accountable for the cost.

## 2. Enumerate what you would actually need

Restoring the database is not restoring the service. Write down everything required to serve
traffic again:

- Application data, and each datastore separately
- **Secrets and credentials:** routinely forgotten, and a restore blocks completely without them
- Configuration and infrastructure definitions
- DNS, certificates, and their issuance
- Object storage, uploads, generated assets
- Third-party state you do not control, and what you cannot restore at all

That last category deserves explicit attention. Some things are simply gone; knowing which
changes the plan.

**Done when:** the list is complete enough that someone could rebuild from it.

## 3. Make backups survive the disaster

A backup that fails with the thing it protects is not a backup.

- **Separate failure domain:** different account, different region, different credentials. A
  backup in the same account is destroyed by a compromised account
- **Immutable or write-once** where possible. Ransomware and a bad script both delete backups
  the running system can reach
- **Encrypted**, with the key stored somewhere you can reach *during* the disaster. Encrypting
  backups with a key only available in the system you lost is a genuine and recurring mistake
- **Retention that spans discovery time:** corruption is often noticed weeks later, so keep
  enough history to reach a clean copy
- **Monitored.** A silently failing backup job is discovered at the worst moment. Alert on
  backup age, not just on job failure

**Done when:** losing the primary environment entirely still leaves the backups reachable.

## 4. Rehearse the restore, on a schedule

This is the step that distinguishes real DR from documented DR.

- **Restore to a scratch environment**, at least quarterly
- **Time it.** The measured duration is your real RTO, and it is usually far longer than the
  estimate — restore speed on production-sized data is the number nobody has
- **Verify the data**, not just that the restore command exited zero. Row counts, checksums,
  spot-checked records
- **Have someone who did not write the procedure run it.** That is what surfaces the missing
  step
- **Record the result** and fix what broke

**Done when:** you have a measured restore time from a real rehearsal, not an estimate.

## 5. Match architecture to the RTO you promised

- **Backup and restore:** cheapest, RTO in hours. Fine for most systems
- **Warm standby:** a scaled-down replica, promoted on failure. RTO in minutes
- **Active-active:** no failover step, RTO near zero, and by far the most expensive and complex

Failover has its own hazards worth planning for: split-brain if both sides accept writes, and
**failing back**, which is frequently harder than failing over because the primary has to catch
up on everything that happened while it was down.

**Done when:** the architecture can meet the stated RTO, or the RTO has been revised honestly.

## 6. Write the plan for someone else

The person executing may not be you, and may be doing it at 4am.

Exact commands, in order, with expected output. Where credentials come from. Who to notify. How
to verify success. What to do if a step fails. See `runbooks`.

Keep a copy **outside** the system it recovers. A DR plan stored only in the wiki that is down is
a well-known and entirely avoidable failure.

**Done when:** someone unfamiliar could execute it from the document alone.

## Report

State RPO and RTO, the measured restore time from the last rehearsal and its date, where backups
live, and what is **not** recoverable. That last item is the most valuable line in the document —
knowing what you would permanently lose is what drives the decision to invest further.
