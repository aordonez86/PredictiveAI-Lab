# Cuenta Clara

A reproducible consumer-risk audit of Colombian lottery prize schedules and a prequential forecast benchmark. A winning ticket, a break-even refund and a profitable ticket are different economic outcomes.

## Run

Python 3.12+, standard library only. No account or keys required.

```sh
python audit.py
python evaluate.py
python -m unittest discover -s tests -v
```

Use `python evaluate.py --input downloaded.json` to evaluate a locally archived API response. The historical dataset is fetched from Datos Abiertos Colombia at runtime and filtered through 2026-10-09. The recorded response hash is provided in historical-results.json. The agency may revise older records.

## Results

On 2026-11-28, 1,024 distinct Medellín draws were retrieved (2007-01-05 to 2026-10-09). After 200 warm-up observations, all three models forecast the next last digit using only earlier draws. The fixed uniform baseline resolves classification ties to zero. Both learned models use Laplace smoothing (Dirichlet prior with concentration 1 per digit). The first conditional model estimates a one-step Markov transition matrix.

| Forecast | Hits / 824 | Log loss (lower is better) | Illustrative net at COP 1,000 stake, before tax |
|---|---:|---:|---:|
| Uniform | 85 | 2.30259 | -399,000 |
| Historical frequency | 84 | 2.31310 | -404,000 |
| Markov | 67 | 2.37418 | -489,000 |

The learned models underperformed the uniform baseline. This exploratory comparison uses the same evaluation sequence as earlier analysis; it is not an untouched confirmatory holdout. No predictive edge was demonstrated.

## Prize accounting

Let X be the receipt and C the purchase cost. Report P(X>C), P(X=C), P(X<C), E[X-C] and E[X]/C. The expected receipt is computed over mutually exclusive outcomes. Removing the jackpot sets only the major prize component to zero while retaining the original cost.

* Bogotá draw 2874, 26 November 2026: COP 6,000 per fraction, 470 series and 10,000 four-digit numbers. The code uses the published net value per whole ticket divided by three. It groups equivalent series rather than allocating 4.7 million records. The leading approximation tier is chosen first. Two explicitly hypothetical rules (maximum payout or sum of major-number approximation and dry components) model unresolved cross-category overlaps. This is a retrospective uniformly sampled ticket universe, not a distribution over actually sold tickets. The operator's count for all-distinct-number permutations may differ for the repeated digits in this particular major. Under these assumptions 2.9083–2.9391% of fractions earn a profit and mean payout is COP 1,772–1,775. Without the exact major it is about COP 1,207–1,210.
* MiLoto draw 648, 26 November 2026: exact hypergeometric probabilities for selecting five distinct numbers from 39. Conditional on the published payout vector, three or more matches give 1.0041% profit probability and the mean gross payout is COP 1,281 at a COP 4,000 cost. With the jackpot excluded, mean gross payout is COP 847. Shared prizes vary by draw; taxes may reduce actual receipts.
* Chance: the one- and two-digit direct categories pay 5 and 50 per peso of stake respectively under Decreto 1390. Both have gross expected receipts of half the stake under uniformity. The command uses an illustrative 19% VAT scenario on top of the stake, configurable in the function. The historical simulation excludes tax and uses constant stakes and payments, not actual spending records.

No promotions are modeled because their relevant eligibility and payouts were not independently established. The results are retrospective and are not instructions to wager or forecasts of future winners.

## Sources and provenance

* [Medellín official major results](https://www.datos.gov.co/es/Comercio-Industria-y-Turismo/RESULTADOS-PREMIO-MAYOR-LOTERIA-DE-MEDELLIN/4w3i-wxax). The original API response is retrieved directly; it is not redistributed.
* [Bogotá draw 2874](https://bogota.gov.co/mi-ciudad/hacienda/2026-11/resultados-del-sorteo-loteria-de-bogota-jueves-26-de-noviembre-de-2026). The JSON contains factual numerical results transcribed for the audit.
* [Bogotá published prize plan](https://institucional.loteriadebogota.com/premios/) and [ticket price and series](https://institucional.loteriadebogota.com/faq/cuantas-fracciones-tiene-un-billete-de-la-loteria-de-bogota-y-cuanto-cuesta-2/). Accessed 2026-11-28. Published counts are not assumed to establish the contractual cross-category overlap policy.
* [MiLoto draw 648](https://baloto.com/miloto/resultados-miloto/648/) and [game rules](https://www.baloto.com/miloto/como-jugar/).
* [Decreto 1390 de 2024](https://normograma.supersalud.gov.co/compilacion/docs/decreto_1390_2024.htm).
* [Number preferences in lotteries](https://www.cambridge.org/core/journals/judgment-and-decision-making/article/number-preferences-in-lotteries/47BA27051627CEED421AD3AEE255521E): behavioral evidence for non-uniform player choices. This can affect shared prize allocation, not the probability of an independent draw. No local selection data were available to fit such a model.
* Software licensing remains pending maintainer selection; third-party source material retains its original terms.

## Files

- audit.py: exact count model, including separate refund and loss categories.
- bogota_2874.json: dated factual inputs.
- evaluate.py: validated chronological import and probabilistic benchmark.
- audit-results.json, historical-results.json: recorded outputs.
- tests/: numerical identities, overlap handling, and validation checks.

The code has no purchase integration and requires no user data.
