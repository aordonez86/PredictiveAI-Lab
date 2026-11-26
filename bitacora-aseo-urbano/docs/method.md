# Data contract and pilot protocol

## Batch contract v1

Use UTF-8 JSON following examples/demo.json. version is 1. origen is sintetico (demo) or operativo (user-declared). corte is the observation cutoff. casos is a list of at most 1,000 distinct anonymized points. Use UTC ISO timestamps with seconds and Z. Convert local times before import. An empty list is valid. Limit files to 2 MB.

Each point has punto (unique ID), cierre (confirmed clean at this instant), fuente (audit reference supporting that initial state), and visitas (at most 500). Each visit has hora, tipo, antes and fuente. Text identifiers and source references have a maximum length of 120 characters. Use chronological order and distinct timestamps per point. The app rejects events after cutoff. Use one index episode per point per batch. Exclude personally identifiable information. The app validates structure and chronology. Source verification and completeness require human review.

| tipo | Meaning |
| --- | --- |
| inspeccion | Inspection only |
| programada | Scheduled cleanup |
| extraordinaria | Additional cleanup dispatch |

antes describes the state immediately before service: limpio, residuos, or desconocido. Use desconocido when there is only a post-service photo. Every cleanup visit ends observation of the original episode, after accounting for its pre-service state. Later events remain visible. An extraordinary dispatch may have been necessary. Avoidability requires comparison.

## Endpoints

Day seven is exactly 168 hours after initial confirmed clean. Only episodes that reach that timestamp by the cutoff are eligible. Use the recorded pre-service state at that instant if the original episode is still under observation. All other eligible states are missing. Strict time matching is deliberate for this reference implementation. A real pilot must preregister a practical tolerance and test sensitivity before deployment. Report eligible, observed and positive counts side by side. With N eligible points, S observed and P positive, bound prevalence by P/N and (P+N-S)/N. A zero denominator is undefined.

For first observed recurrence, report (last observed clean, first observed waste]. This brackets the observed episode assuming no undocumented intermediate changes or clearance. No observed recurrence cannot establish continuous cleanliness. A clean inspection after a repeat cleanup cannot characterize the original episode.

Break-even trips = ceiling((incremental prevention + incremental follow-up) / marginal cost per extra trip). Use whole COP and the same horizon. Include only expenses that actually vary with the dispatch. Report staff hours separately. Missing costs leave the estimate unavailable. No causal effects are estimated.

## From prototype to pilot

Have two independent reviewers reconstruct the same anonymized episode from its sources. Compare timestamps, visit type and pre-service state. Document disagreements. If reliable, specify comparable points, baseline service, intervention, allocation, observation schedule and decision threshold before collecting outcomes. Track missing observations, reporting differences and spillover to adjacent streets. Use sample size informed by baseline variability before comparing interventions. If observations are sparse, prioritize representative inspection sampling. Another city can map its visit labels to this schema. Currency and the observation rule are explicit localization points.

## Evidence and provenance

- [Ciudad Limpia, 29 September 2026](https://ciudadlimpia.com/noticias/mientras-ciudad-limpia-cuida-a-bogota-nosotros-tambien-podemos-cuidarla/) describes repeated attention around public bins in Bogotá.
- [UAESP catalogue](https://datosabiertos.bogota.gov.co/dataset?organization=uaesp&q=puntos+criticos) identifies public inventories and aggregate waste resources. An inventory is insufficient to reconstruct a sequence of visits.
- [Lancaster intervention report, January 2023](https://committeeadmin.lancaster.gov.uk/documents/s92099/Appendix%2B3.%2BLancaster%2BFly-tipping%2BInterventions%2BReport.pdf) documents an international evaluation precedent.
- [Buenos Aires urban hygiene inspections](https://data.buenosaires.gob.ar/es_AR/dataset/control-higiene-urbana) is a candidate for investigating category portability.

These references motivate the design. No rows or geometry from those sources ship with the app. Check resource-level licenses, dates and granularity before any future integration.
