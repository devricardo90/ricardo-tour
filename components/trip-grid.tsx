"use client";

import { motion } from "motion/react";
import { TripCard } from "./trips/trip-card";
import { TripCardData } from "@/lib/types";

interface TripGridProps {
    trips: TripCardData[];
}

export function TripGrid({ trips }: TripGridProps) {
    return (
        <div className="space-y-5">
            {trips.length === 0 ? (
                <div className="surface-dark px-5 py-10 text-center text-white/62">
                    Nenhum passeio disponivel no momento.
                </div>
            ) : (
                <motion.div
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
                    variants={{
                        hidden: { opacity: 0 },
                        show: {
                            opacity: 1,
                            transition: { staggerChildren: 0.08 },
                        },
                    }}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-50px" }}
                >
                    {trips.map((trip) => (
                        <motion.div
                            key={trip.id}
                            variants={{
                                hidden: { opacity: 0, scale: 0.97, y: 14 },
                                show: {
                                    opacity: 1,
                                    scale: 1,
                                    y: 0,
                                    transition: { type: "spring", stiffness: 280, damping: 24 },
                                },
                            }}
                        >
                            <TripCard trip={trip} />
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
}
