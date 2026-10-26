import math

def calculate_haversine_distance(lat1, lon1, lat2, lon2):
    """Calculates distance between two coordinates in kilometers using Haversine formula."""
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

def optimize_collection_route(start_lat, start_lon, reports):
    """
    Greedy Nearest Neighbor with Priority Weighting for dynamic collection route optimization.
    Prioritizes 'urgent' and 'high' severity reports while minimizing travel distance.
    """
    if not reports:
        return []

    severity_weight = {
        'urgent': 0.3,
        'high': 0.6,
        'medium': 1.0,
        'low': 1.4
    }

    unvisited = list(reports)
    current_lat, current_lon = start_lat, start_lon
    ordered_stops = []
    current_order = 1
    total_km = 0.0

    while unvisited:
        best_stop = None
        best_score = float('inf')
        best_dist = 0.0

        for r in unvisited:
            dist = calculate_haversine_distance(current_lat, current_lon, r.latitude, r.longitude)
            # Weighted score: distance multiplied by urgency penalty (lower is better)
            weight = severity_weight.get(r.severity, 1.0)
            score = dist * weight

            if score < best_score:
                best_score = score
                best_stop = r
                best_dist = dist

        if best_stop:
            unvisited.remove(best_stop)
            total_km += best_dist
            ordered_stops.append({
                'report': best_stop,
                'stop_order': current_order,
                'distance_from_prev_km': round(best_dist, 2),
                'cumulative_km': round(total_km, 2),
                'estimated_minutes': round(best_dist * 4.5 + 8, 1)  # travel time + pickup time
            })
            current_lat = best_stop.latitude
            current_lon = best_stop.longitude
            current_order += 1

    return ordered_stops
