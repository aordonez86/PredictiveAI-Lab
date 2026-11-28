"""Prequential probabilistic evaluation against the uniform null."""
import argparse
from collections import Counter
from datetime import date
import hashlib
import json
from math import log
from pathlib import Path
from urllib.request import urlopen

URL = "https://www.datos.gov.co/resource/4w3i-wxax.json?$limit=5000"
CUTOFF = date(2026,10,9)


def parse(raw):
    draws={}
    for row in json.loads(raw):
        day=date.fromisoformat(row["fecha"][:10])
        if day>CUTOFF:
            continue
        value=row["n_mero"].strip()
        if not value.isascii() or not value.isdigit() or len(value)>4:
            raise ValueError("Invalid winning number")
        key=int(row["sorteo"])
        item=day,int(value[-1])
        if key in draws and draws[key]!=item:
            raise ValueError("Conflicting duplicate draw")
        draws[key]=item
    ordered=sorted(draws.values())
    if len(ordered)<201 or len({d for d,_ in ordered})!=len(ordered):
        raise ValueError("Insufficient or ambiguous chronology")
    return ordered


def evaluate(series, burn=200):
    if not 0<burn<len(series):
        raise ValueError("Invalid warmup")
    global_counts=Counter()
    transitions=[Counter() for _ in range(10)]
    previous=None
    scores={name:{"hits":0,"loss":0.0} for name in ("uniform","frequency","markov")}
    for i,(_,digit) in enumerate(series):
        if i>=burn:
            row=transitions[previous]
            distributions={
                "uniform":[0.1]*10,
                "frequency":[(global_counts[k]+1)/(i+10) for k in range(10)],
                "markov":[(row[k]+1)/(sum(row.values())+10) for k in range(10)]
            }
            for name,p in distributions.items():
                scores[name]["hits"]+=digit==max(range(10),key=p.__getitem__)
                scores[name]["loss"]-=log(p[digit])
        global_counts[digit]+=1
        if previous is not None:
            transitions[previous][digit]+=1
        previous=digit
    n=len(series)-burn
    return {name:{"accuracy":score["hits"]/n,"hits":score["hits"],
                  "log_loss":score["loss"]/n,"simulated_net_before_tax":1000*(5*score["hits"]-n)}
            for name,score in scores.items()}


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--input",type=Path)
    args=parser.parse_args()
    raw=args.input.read_bytes() if args.input else urlopen(URL,timeout=30).read()
    series=parse(raw)
    print(json.dumps({"sha256":hashlib.sha256(raw).hexdigest(),"draws":len(series),
        "from":str(series[0][0]),"to":str(series[-1][0]),"evaluation":evaluate(series)},indent=2))


if __name__=="__main__":
    main()
