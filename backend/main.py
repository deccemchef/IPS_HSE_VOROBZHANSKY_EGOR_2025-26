from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator, model_validator
from typing import Literal, Optional
from demand import marginal_benefit, total_value
from optimizer import find_best_q
from pricing import uniform_price, pd1_price, pd2_price, pd3_price
from simulation import run_simulation


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Pydantic models ---

class BuyerModel(BaseModel):
    id: int
    money: float
    segment: Literal["A", "B", "C"]
    target_stock: int
    stock: int
    demand_type: Literal["linear", "inverse_square", "step"]
    params: dict

    @field_validator("money")
    @classmethod
    def money_non_negative(cls, v):
        if v < 0:
            raise ValueError("money must be >= 0")
        return v

    @field_validator("target_stock", "stock")
    @classmethod
    def stock_non_negative(cls, v):
        if v < 0:
            raise ValueError("stock values must be >= 0")
        return v

    @model_validator(mode="after")
    def check_params(self):
        d = self.demand_type
        p = self.params
        if d == "linear":
            if "a" not in p or "b" not in p:
                raise ValueError("linear demand requires 'a' and 'b'")
            if p["b"] <= 0:
                raise ValueError("linear demand: 'b' must be > 0")
        elif d == "inverse_square":
            if "A" not in p:
                raise ValueError("inverse_square demand requires 'A'")
            if p["A"] <= 0:
                raise ValueError("inverse_square demand: 'A' must be > 0")
        elif d == "step":
            if "values" not in p or not isinstance(p["values"], list):
                raise ValueError("step demand requires 'values' as list")
            if any(v < 0 for v in p["values"]):
                raise ValueError("step demand: all values must be >= 0")
        return self


class SimulateRequest(BaseModel):
    pricing_mode: Literal["uniform", "pd1", "pd2", "pd3"]
    pricing_params: dict
    buyers: list[BuyerModel]
    mc: float
    capacity_per_day: Optional[int] = None

    @field_validator("mc")
    @classmethod
    def mc_non_negative(cls, v):
        if v < 0:
            raise ValueError("mc must be >= 0")
        return v

    @field_validator("capacity_per_day")
    @classmethod
    def capacity_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError("capacity_per_day must be > 0")
        return v

    @model_validator(mode="after")
    def check_pricing_params(self):
        mode = self.pricing_mode
        p = self.pricing_params
        if mode == "uniform":
            if "p" not in p:
                raise ValueError("uniform mode requires 'p'")
            if p["p"] < 0:
                raise ValueError("uniform: 'p' must be >= 0")
        elif mode == "pd2":
            if "F" not in p or "p" not in p:
                raise ValueError("pd2 mode requires 'F' and 'p'")
            if p["F"] < 0 or p["p"] < 0:
                raise ValueError("pd2: 'F' and 'p' must be >= 0")
        elif mode == "pd3":
            if "segment_prices" not in p:
                raise ValueError("pd3 mode requires 'segment_prices'")
            for seg, price in p["segment_prices"].items():
                if price < 0:
                    raise ValueError(f"pd3: price for segment {seg} must be >= 0")
        return self


PRICING_FUNCS = {
    "uniform": uniform_price,
    "pd1": pd1_price,
    "pd2": pd2_price,
    "pd3": pd3_price,
}


# --- Endpoints ---

@app.get("/")
def root():
    return {"message": "Server is running"}


@app.post("/simulate")
def simulate(request: SimulateRequest):
    pricing_func = PRICING_FUNCS[request.pricing_mode]
    buyers_dicts = [b.model_dump() for b in request.buyers]

    result = run_simulation(
        buyers=buyers_dicts,
        pricing_func=pricing_func,
        pricing_params=request.pricing_params,
        mc=request.mc,
        capacity_per_day=request.capacity_per_day
    )

    return result


@app.get("/test-demand")
def test_demand():
    buyer_linear = {"id": 1, "demand_type": "linear", "params": {"a": 10, "b": 2}}
    buyer_inverse = {"id": 2, "demand_type": "inverse_square", "params": {"A": 20}}
    buyer_step = {"id": 3, "demand_type": "step", "params": {"values": [10, 10, 6, 6, 2]}}

    results = {}
    for buyer in [buyer_linear, buyer_inverse, buyer_step]:
        mb_list = [marginal_benefit(buyer, k) for k in range(1, 6)]
        results[buyer["demand_type"]] = {"MB_1_to_5": mb_list, "V_5": total_value(buyer, 5)}

    return results


@app.get("/test-optimizer")
def test_optimizer():
    buyer = {"id": 1, "money": 30, "segment": "A", "demand_type": "linear", "params": {"a": 10, "b": 2}}
    gap = 5
    return {
        "uniform": find_best_q(buyer, gap, uniform_price, {"p": 4}),
        "pd1": find_best_q(buyer, gap, pd1_price, {}),
        "pd2": find_best_q(buyer, gap, pd2_price, {"F": 5, "p": 3}),
        "pd3": find_best_q(buyer, gap, pd3_price, {"segment_prices": {"A": 3, "B": 5, "C": 7}})
    }


@app.get("/test-simulation")
def test_simulation():
    buyers = [
        {"id": 1, "money": 30, "segment": "A", "target_stock": 5, "stock": 1, "demand_type": "linear", "params": {"a": 10, "b": 2}},
        {"id": 2, "money": 25, "segment": "B", "target_stock": 4, "stock": 0, "demand_type": "inverse_square", "params": {"A": 20}},
        {"id": 3, "money": 20, "segment": "C", "target_stock": 6, "stock": 2, "demand_type": "step", "params": {"values": [10, 10, 6, 6, 2]}}
    ]
    return run_simulation(buyers=buyers, pricing_func=uniform_price, pricing_params={"p": 4}, mc=2, capacity_per_day=20)
