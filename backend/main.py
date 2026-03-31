from fastapi import FastAPI
from demand import marginal_benefit, total_value
from fastapi.middleware.cors import CORSMiddleware
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


@app.get("/")
def root():
    return {"message": "Server is running"}


@app.get("/test-demand")
def test_demand():
    buyer_linear = {
        "id": 1,
        "demand_type": "linear",
        "params": {"a": 10, "b": 2}
    }

    buyer_inverse = {
        "id": 2,
        "demand_type": "inverse_square",
        "params": {"A": 20}
    }

    buyer_step = {
        "id": 3,
        "demand_type": "step",
        "params": {"values": [10, 10, 6, 6, 2]}
    }

    results = {}

    for buyer in [buyer_linear, buyer_inverse, buyer_step]:
        mb_list = []
        for k in range(1, 6):
            mb_list.append(marginal_benefit(buyer, k))

        v = total_value(buyer, 5)

        results[buyer["demand_type"]] = {
            "MB_1_to_5": mb_list,
            "V_5": v
        }

    return results



@app.get("/test-optimizer")
def test_optimizer():
    buyer = {
        "id": 1,
        "money": 30,
        "segment": "A",
        "demand_type": "linear",
        "params": {"a": 10, "b": 2}
    }

    gap = 5

    uniform_result = find_best_q(
        buyer=buyer,
        gap=gap,
        pricing_func=uniform_price,
        pricing_params={"p": 4}
    )

    pd1_result = find_best_q(
        buyer=buyer,
        gap=gap,
        pricing_func=pd1_price,
        pricing_params={}
    )

    pd2_result = find_best_q(
        buyer=buyer,
        gap=gap,
        pricing_func=pd2_price,
        pricing_params={"F": 5, "p": 3}
    )

    pd3_result = find_best_q(
        buyer=buyer,
        gap=gap,
        pricing_func=pd3_price,
        pricing_params={
            "segment_prices": {
                "A": 3,
                "B": 5,
                "C": 7
            }
        }
    )

    return {
        "uniform": uniform_result,
        "pd1": pd1_result,
        "pd2": pd2_result,
        "pd3": pd3_result
    }




@app.get("/test-simulation")
def test_simulation():
    buyers = [
        {
            "id": 1,
            "money": 30,
            "segment": "A",
            "target_stock": 5,
            "stock": 1,
            "demand_type": "linear",
            "params": {"a": 10, "b": 2}
        },
        {
            "id": 2,
            "money": 25,
            "segment": "B",
            "target_stock": 4,
            "stock": 0,
            "demand_type": "inverse_square",
            "params": {"A": 20}
        },
        {
            "id": 3,
            "money": 20,
            "segment": "C",
            "target_stock": 6,
            "stock": 2,
            "demand_type": "step",
            "params": {"values": [10, 10, 6, 6, 2]}
        }
    ]

    result = run_simulation(
        buyers=buyers,
        pricing_func=uniform_price,
        pricing_params={"p": 4},
        mc=2,
        capacity_per_day=20
    )

    return result
