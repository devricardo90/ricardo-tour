import TripList from "./trip-list";
import { ReservationHeaders } from "./reservation-headers";

export function ReservationsSection() {
  return (
    <ReservationHeaders>
      <TripList />
    </ReservationHeaders>
  );
}
