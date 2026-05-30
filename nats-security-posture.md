# NATS Security Posture - Platform Finding

**Raised during:** demo UI update planning (May 2026)  
**Owner:** Infrastructure / platform team  
**Scope:** All Tazama deployments (sandbox and production)  
**Priority:** High for production; Medium for sandbox (synthetic data only)

---

## Finding

The Tazama platform uses NATS as its internal message bus with no authentication and no subject-level authorisation enforced in any deployment. The `frms-coe-lib` `IStartupConfig` interface has no credential fields - only `serverUrl: string`. Any NATS credentials must be embedded in the URL itself (`nats://user:pass@host:4222`). The `.env.template` files across all services show bare `SERVER_URL=0.0.0.0:4222` with no credentials, confirming this is the default state.

The NATS bus carries the full transaction payload at every pipeline hop:
- Debtor/creditor account numbers, amounts, and identities (pacs.008)
- Rule execution results (with the original transaction attached)
- Typology scores (with the original transaction attached)
- TADProc alert and interdiction decisions (with the original transaction attached)

Any process with network access to the NATS service port can subscribe to `>` (all subjects) and receive every transaction for every tenant in real time, silently and indefinitely. NATS has no subscription audit log by default.

---

## Threat Model

### Attack path (current state)

Getting to NATS from outside the cluster requires a prior foothold. Realistic vectors:

| Vector | Description |
|---|---|
| Exploit a vulnerability in any externally-exposed service (demo UI, TMS, admin-service) | Gains code execution in that pod; from there the NATS service is reachable by internal DNS |
| Compromised Kubernetes credentials (`kubeconfig`, service account token) | `kubectl exec` into any pod, or deploy a new pod, then connect to NATS |
| Supply chain compromise of any npm/pip/container dependency in any Tazama service | Malicious code running inside a legitimate pod has full cluster-internal network access |
| Container escape via kernel vulnerability | Access to the node network, from which NATS is reachable |

The demo UI's current SSRF bug (Problem 4 in `demo-ui-update.md`) is the most direct path from the public internet to NATS - an unauthenticated attacker can send a Socket.IO `uiconfig` message pointing to the NATS internal address and have the demo UI server (inside the cluster) connect on their behalf. This is being fixed in Phase 1 of the demo UI update.

### What an attacker can do with NATS access

| Action | Impact |
|---|---|
| Subscribe to `>` | Read all transaction data for all tenants in real time. In production: full PII and financial data exfiltration. |
| Publish fabricated messages | Inject fake rule results, typology scores, or TADProc decisions. Could suppress real alerts or trigger false positives. Difficult to detect without message signing. |
| Replay captured messages | Replay legitimate transactions to generate duplicate processing results. |
| DoS via message flooding | Overwhelm the NATS server or downstream consumers with high-volume publishes. |

---

## Current Mitigations (none application-level)

None of the Tazama services implement any NATS security controls in application code. The sole current protection is assumed network isolation - NATS is not intended to be exposed outside the cluster. Whether a Kubernetes `NetworkPolicy` is in place to enforce this is unconfirmed.

---

## Recommended Mitigations

Listed in order of effort and immediate impact.

### 1. Kubernetes NetworkPolicy (low effort - do this first)

Restrict the NATS service port to only pods that legitimately need it. Everything else in the cluster is denied.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: nats-access
spec:
  podSelector:
    matchLabels:
      app: nats
  ingress:
  - from:
    - podSelector:
        matchLabels:
          tazama-nats-client: "true"
    ports:
    - port: 4222
```

Label all Tazama service pods with `tazama-nats-client: "true"`. Nothing else in the cluster can reach NATS. No application code changes required.

**Effort:** Low (Kubernetes YAML config only)  
**Impact:** Eliminates lateral movement from any compromised non-Tazama workload in the cluster

### 2. NATS username/password credentials (low effort)

Configure the NATS server to require a username and password. Embed credentials in all services' `SERVER_URL` env vars:

```
SERVER_URL=nats://tazama-svc:s3cr3t@nats-service:4222
```

No application code changes required - the NATS client library parses credentials from the URL automatically.

**Effort:** Low (NATS server config + deployment env vars)  
**Impact:** Eliminates completely unauthenticated access; credentials are required to connect  
**Limitation:** All services share one credential; no per-service isolation

### 3. NATS TLS (medium effort)

Enable TLS on the NATS listener so all in-flight data is encrypted. Required for any deployment where the cluster network cannot be fully trusted (multi-tenant Kubernetes, shared node pools, etc.).

```
# nats-server.conf
tls {
  cert_file: "/etc/nats/tls/server.crt"
  key_file:  "/etc/nats/tls/server.key"
  ca_file:   "/etc/nats/tls/ca.crt"
}
```

Services connect with `tls://` scheme in `SERVER_URL`. The `nats` npm package supports TLS natively.

**Effort:** Medium (cert management, NATS server config, deployment changes)  
**Impact:** All pipeline traffic encrypted in transit; mitigates network-level eavesdropping

### 4. NATS NKey / operator JWT auth with per-service credentials (high effort)

The correct end-state for production. Each service gets its own NKey identity, scoped to only the subjects it legitimately publishes to and subscribes from. Subject-level permissions are defined in the NATS operator config.

Example scoping:
- `event-director`: publish `sub-rule-*`; subscribe on transaction ingest subject only
- `rule-executer`: subscribe `sub-rule-*`; publish `pub-rule-*`
- `typology-processor`: subscribe `pub-rule-*`; publish `typology-*` and interdiction subjects
- `TADProc`: subscribe `typology-*`; publish alert subjects
- `demo-ui`: subscribe `pub-rule-*`, `typology-*`, alert subjects; no publish permissions

This is the correct security model for a financial data bus. Compromising one service does not expose the whole bus.

**Effort:** High (NATS operator config, credential rotation, changes to all service deployments)  
**Impact:** Full isolation; a compromised service cannot exfiltrate data from other subjects

---

## Recommended Sequence

1. **Immediately:** Confirm that NATS port 4222 is not exposed via any Kubernetes Service of type `NodePort` or `LoadBalancer`. If it is, change to `ClusterIP`.
2. **Short term:** Apply `NetworkPolicy` (item 1 above). Zero code changes, significant impact.
3. **Before production with real data:** Implement NATS credentials in `SERVER_URL` (item 2) and TLS (item 3).
4. **Before regulated/live deployment:** Implement NKey auth with subject-level permissions (item 4).

---

## Related

- `demo-ui-update.md` Section 3.3 - NATS authentication current state and platform security note
- `demo-ui-update.md` Problem 4 - SSRF via browser-controlled NATS URL (being fixed in Phase 1)
