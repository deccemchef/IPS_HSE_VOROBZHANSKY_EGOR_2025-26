
from optimizer import find_best_q


def compute_gap(buyer):
    target_stock = buyer["target_stock"]
    stock = buyer["stock"]

    return max(0, target_stock - stock)


def run_simulation(buyers, pricing_func, pricing_params, mc,
                   capacity_per_day=None):
    buyers_results = []

    total_q = 0
    total_revenue = 0
    total_cs = 0

    for buyer in buyers:
        gap = compute_gap(buyer)

        if capacity_per_day is not None:
            remaining_capacity = max(0, capacity_per_day - total_q)
            effective_gap = min(gap, remaining_capacity)
        else:
            effective_gap = gap

        best_result = find_best_q(
            buyer=buyer,
            gap=effective_gap,
            pricing_func=pricing_func,
            pricing_params=pricing_params
        )

        buyer_result = {
            "id": buyer["id"],
            "segment": buyer["segment"],
            "demand_type": buyer["demand_type"],
            "gap": gap,
            "effective_gap": effective_gap,
            "q": best_result["q"],
            "value": best_result["value"],
            "payment": best_result["payment"],
            "utility": best_result["utility"],
            "consumer_surplus": best_result["consumer_surplus"]
        }

        buyers_results.append(buyer_result)

        total_q += best_result["q"]
        total_revenue += best_result["payment"]
        total_cs += best_result["consumer_surplus"]

    variable_cost = mc * total_q
    profit = total_revenue - variable_cost
    producer_surplus = profit
    welfare = total_cs + producer_surplus

    return {
        "buyers_results": buyers_results,
        "totals": {
            "Q": total_q,
            "Revenue": total_revenue,
            "VarCost": variable_cost,
            "Profit": profit,
            "CS": total_cs,
            "PS": producer_surplus,
            "W": welfare
        }
    }
