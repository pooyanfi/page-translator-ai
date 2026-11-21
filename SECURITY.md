# Security policy

## Reporting a vulnerability

Please **do not open a public issue** for a security problem. Use GitHub's private reporting
channel instead: **Security → Report a vulnerability** on this repository. If that is unavailable,
contact the maintainer privately and include:

- the affected version (`manifest.json` → `version`),
- the browser and version,
- a minimal reproduction (page type, provider, what happened),
- what an attacker gains.

You can expect an acknowledgement within a week. Please give a fix a reasonable amount of time
before publishing details.

## Scope

In scope:

- Anything that lets model output become markup, script or an attribute the extension did not allow
  (the design goal is text-only output through `textContent`, with no `innerHTML` anywhere).
- Anything that leaks the stored API key, page text or per-site preferences to a party other than the
  provider the user configured.
- Anything that lets a third party drive the `AIPT_FETCH` message channel as a proxy (the service
  worker checks `sender.id`).
- Permission or manifest mistakes that grant more access than the README documents.

Out of scope:

- The privacy or pricing practices of the provider you connect (Gemini, OpenRouter, Ollama, …).
- Text you deliberately send to a provider; that is the extension's documented job.
- Attacks that require a compromised browser profile, a malicious extension with the same
  privileges, or physical access.
- Model quality problems (mistranslations, refused paragraphs). Those are limitations, not
  vulnerabilities — see the README's "Known limitations".

## What the extension deliberately does not do

- No remote code, no `eval`, no `new Function`, no analytics endpoint.
- No account, no server owned by the project, no hidden network requests.
- No page text is sent anywhere unless you start a translation, and then it goes only to the
  endpoint configured in Options.
