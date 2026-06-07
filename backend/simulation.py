from optimizer import find_best_q
from demand import total_value


def compute_gap(buyer):
    # Сколько единиц покупатель ещё может купить (target_stock - stock)
    target_stock = buyer["target_stock"]
    stock = buyer["stock"]
    return max(0, target_stock - stock)


def compute_efficient_q(buyer, gap, mc):
    # Оптимальный объем при конкурентной цене P=MC - эталон для расчёта DWL
    best_q = 0
    best_welfare = 0
    for q in range(1, gap + 1):
        w = total_value(buyer, q) - mc * q
        if w > best_welfare:
            best_welfare = w
            best_q = q
    return best_q


def run_simulation(buyers, pricing_func, pricing_params, mc, capacity_per_day=None):
    buyers_results = []

    total_q = 0
    total_revenue = 0
    total_cs = 0
    total_efficient_welfare = 0

    for buyer in buyers:
        gap = compute_gap(buyer)

        # Ограничиваем объем покупки мощностью фирмы если она задана
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

        # Считаем эффективное благосостояние для этого покупателя при P=MC
        q_eff = compute_efficient_q(buyer, gap, mc)
        buyer_efficient_welfare = total_value(buyer, q_eff) - mc * q_eff

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
            "consumer_surplus": best_result["consumer_surplus"],
            "q_eff": q_eff,
            "efficient_welfare": round(buyer_efficient_welfare, 4)
        }

        buyers_results.append(buyer_result)

        total_q += best_result["q"]
        total_revenue += best_result["payment"]
        total_cs += best_result["consumer_surplus"]
        total_efficient_welfare += buyer_efficient_welfare

    # Агрегируем итоговые показатели фирмы и рынка
    variable_cost = mc * total_q
    profit = total_revenue - variable_cost
    producer_surplus = profit
    welfare = total_cs + producer_surplus
    dwl = total_efficient_welfare - welfare

    return {
        "buyers_results": buyers_results,
        "totals": {
            "Q": total_q,
            "Revenue": total_revenue,
            "VarCost": variable_cost,
            "Profit": profit,
            "CS": total_cs,
            "PS": producer_surplus,
            "W": round(welfare, 4),
            "W_eff": round(total_efficient_welfare, 4),
            "DWL": round(max(0.0, dwl), 4)
        }
    }
