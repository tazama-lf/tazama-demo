// SPDX-License-Identifier: Apache-2.0
/**
 * Derives the NATS subscription subjects (rule responses + typology results)
 * the BFF needs to fan out per Socket.IO session, from an active network-map
 * configuration as returned by the admin service.
 *
 * Authored as CommonJS so `server.js` can `require()` it directly.
 *
 * Invariant: a tenant must have exactly one active network-map configuration.
 * The admin service does not enforce this today, so we defensively pin to
 * `data[0]` and `console.warn` when more than one active entry is returned
 * to make the violation visible to operators.
 */

/**
 * @typedef {{ id?: string | number }} RuleRef
 * @typedef {{ cfg?: string, rules?: RuleRef[] }} TypologyRef
 * @typedef {{ typologies?: TypologyRef[] }} MessageRef
 * @typedef {{ messages?: MessageRef[] }} NetworkMapConfig
 * @typedef {{ data?: NetworkMapConfig[] } | null | undefined} AdminNetworkMapResponse
 */

/**
 * @param {AdminNetworkMapResponse} networkMap
 * @returns {{ ruleSubjects: string[], typoSubjects: string[] }}
 */
function deriveSubjectsFromNetworkMap(networkMap) {
  const ruleSubjects = []
  const typoSubjects = []
  if (!networkMap) return { ruleSubjects, typoSubjects }

  try {
    const configs = Array.isArray(networkMap.data) ? networkMap.data : []
    // Invariant: exactly one active network-map config per tenant. The admin
    // service does not enforce this today, so we surface a warning if it is
    // violated. We deliberately do not include cfg versions or counts here -
    // diagnosing or fixing the upstream breach is not the demo UI's job.
    if (configs.length > 1) {
      console.warn(
        "Network-map invariant violated: more than one active network-map config returned. Using the first; remaining entries ignored."
      )
    }
    const activeConfig = configs[0]
    if (!activeConfig) return { ruleSubjects, typoSubjects }

    // Defensive iteration: any of `messages`, `typologies`, `rules` may come
    // back as a truthy non-array (the admin service does not enforce a
    // schema). `?? []` only handles null / undefined - a string or object
    // would slip through and the `for...of` would throw, aborting the
    // entire derivation in the outer catch and silently producing an empty
    // subject list (the BFF would then subscribe to nothing and the demo
    // would look broken with no log to explain why). `Array.isArray` lets
    // a malformed nested node be skipped without losing the rest of the
    // valid subjects.
    const messages = Array.isArray(activeConfig.messages) ? activeConfig.messages : []
    for (const message of messages) {
      const typologies = Array.isArray(message?.typologies) ? message.typologies : []
      for (const typology of typologies) {
        if (typology.cfg && !typoSubjects.includes(`typology-${typology.cfg}`)) {
          typoSubjects.push(`typology-${typology.cfg}`)
        }
        const rules = Array.isArray(typology?.rules) ? typology.rules : []
        for (const rule of rules) {
          if (rule && rule.id != null) {
            const subject = `pub-rule-${rule.id}`
            if (!ruleSubjects.includes(subject)) ruleSubjects.push(subject)
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to derive subjects from network map:", err.message)
  }

  return { ruleSubjects, typoSubjects }
}

module.exports = { deriveSubjectsFromNetworkMap }
