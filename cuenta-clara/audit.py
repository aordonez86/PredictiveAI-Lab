"""Exact retrospective prize accounting and probability model."""
from collections import Counter
from fractions import Fraction
from math import comb
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def summarize(histogram, cost):
    total = sum(histogram.values())
    if total <= 0 or cost <= 0 or any(p < 0 or n < 0 for p, n in histogram.items()):
        raise ValueError("Invalid distribution")
    average = sum(p*n for p,n in histogram.items()) / total
    return {
        "profit_probability": sum(n for p,n in histogram.items() if p > cost)/total,
        "break_even_probability": histogram.get(cost,0)/total,
        "loss_probability": sum(n for p,n in histogram.items() if p < cost)/total,
        "mean_payout": float(average),
        "mean_net": float(average-cost),
        "return_ratio": float(average/cost),
        "outcomes": total,
    }


def chance(base=1000, digits=1, tax=Fraction(19,100)):
    if digits not in (1,2) or base <= 0 or tax < 0:
        raise ValueError("Unsupported chance parameters")
    return summarize({5*10**(digits-1)*base:1,0:10**digits-1},base*(1+tax))


def miloto(include_major=True):
    payouts=[0,0,4000,25300,624650,250000000 if include_major else 0]
    hist=Counter()
    for matches, payout in enumerate(payouts):
        hist[payout]+=comb(5,matches)*comb(34,5-matches)
    return summarize(hist,4000)


def approximation(number, major, same_series, include_major):
    a,b,c,d = [x==y for x,y in zip(number,major)]
    if all((a,b,c,d)):
        return (7968000000 if include_major else 0) if same_series else 3759745
    if sum((a,b,c,d))==3:
        return 9000000 if same_series else 54000
    if (a and b) or (c and d) or (a and d) or sorted(number)==sorted(major):
        return 1500000 if same_series else 36000
    if d:
        return 54000 if same_series else 18000
    return 18000 if same_series else 0


def bogota(policy="max", include_major=True):
    if policy not in ("max","sum"):
        raise ValueError("Unsupported overlap policy")
    data=json.loads((ROOT/"bogota_2874.json").read_text())
    major, major_series=data["major"]
    dry={}
    for group in data["dry"]:
        for pair in group["pairs"].split():
            n,s=pair.split(":")
            dry.setdefault(n,[]).append((int(s),group["net_ticket"]))
    assert sum(map(len,dry.values()))==53
    hist=Counter()
    for i in range(10000):
        number=f"{i:04d}"
        prizes=dry.get(number,[])
        special={major_series,*(s for s,_ in prizes)}
        for series,weight in [(s,1) for s in special]+[(-1,470-len(special))]:
            main=approximation(number,major,series==major_series,include_major)
            secondary=[p if s==series else 18000 for s,p in prizes]
            amounts=[main,*secondary]
            payout=max(amounts) if policy=="max" else sum(amounts)
            hist[Fraction(payout,3)]+=weight
    assert sum(hist.values())==4700000
    return summarize(hist,6000)


def report():
    return {
        "chance_1":chance(), "chance_2":chance(digits=2),
        "miloto_648_gross":{str(major):miloto(major) for major in (True,False)},
        "bogota_2874_net_scenarios":{
            policy:{str(major):bogota(policy,major) for major in (True,False)}
            for policy in ("max","sum")
        },
    }


if __name__=="__main__":
    print(json.dumps(report(),indent=2))
