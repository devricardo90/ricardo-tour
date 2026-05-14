import TripList from "./trip-list";
import { ReservationHeaders } from "./reservation-headers";

export function ReservationsSection() {
  return (
    <section className="section-spacing">
      <ReservationHeaders>
        <TripList />
      </ReservationHeaders>
    </section>
  );
}
