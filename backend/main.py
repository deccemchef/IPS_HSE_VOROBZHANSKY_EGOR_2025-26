from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def root():
    return {"message": "Server is running"}

from demand import total_value

from demand import marginal_benefit, total_value


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