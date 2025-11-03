import { FormEvent, useEffect, useMemo, useState } from "react";
import "./App.css";

type DeparturePort = {
  id: string;
  name: string;
  tagline: string;
  vesselTypes: string[];
  scenicHighlight: string;
};

type VesselProfile = {
  baseRate: number;
  capacity: number;
  style: string;
};

const departurePorts: DeparturePort[] = [
  {
    id: "jaffa",
    name: "Jaffa Port · Tel Aviv",
    tagline: "Historic harbor, golden sunsets, and direct access into the heart of Tel Aviv.",
    scenicHighlight: "Arrive with the skyline glowing behind you.",
    vesselTypes: ["Luxury Catamaran", "Performance Monohull", "Expedition Motor Yacht"],
  },
  {
    id: "haifa",
    name: "Haifa Marina",
    tagline: "Dramatic Carmel cliffs, blue water crossings, and effortless onward transfers south.",
    scenicHighlight: "Wake up to Bahá'í gardens cascading to the sea.",
    vesselTypes: ["Luxury Catamaran", "Ocean Crossing Catamaran", "Expedition Motor Yacht"],
  },
  {
    id: "limassol",
    name: "Limassol · Cyprus",
    tagline: "Island hopping launchpad with vibrant culinary scene before you sail east.",
    scenicHighlight: "Combine Cyprus wine country with a midnight arrival into Tel Aviv.",
    vesselTypes: ["Ocean Crossing Catamaran", "Performance Monohull", "Mediterranean Superyacht"],
  },
  {
    id: "athens",
    name: "Athens Riviera · Greece",
    tagline: "Iconic Mediterranean departure with concierge connections to the Aegean islands.",
    scenicHighlight: "Toast under the Acropolis before setting a course for the Levant.",
    vesselTypes: ["Mediterranean Superyacht", "Expedition Motor Yacht"],
  },
];

const vesselCatalog: Record<string, VesselProfile> = {
  "Luxury Catamaran": {
    baseRate: 5400,
    capacity: 12,
    style: "Panoramic decks and stability for effortless lounging.",
  },
  "Performance Monohull": {
    baseRate: 4200,
    capacity: 8,
    style: "Wind-powered adventure for sailors craving heel and speed.",
  },
  "Expedition Motor Yacht": {
    baseRate: 6800,
    capacity: 10,
    style: "Range-first explorer with refined interiors and crewed service.",
  },
  "Ocean Crossing Catamaran": {
    baseRate: 7600,
    capacity: 14,
    style: "Bluewater ready with generous social zones and private suites.",
  },
  "Mediterranean Superyacht": {
    baseRate: 11800,
    capacity: 16,
    style: "Flagship luxury with full crew, tenders, and bespoke concierge.",
  },
};

const travelStyles = [
  { id: "sunset", label: "Sunset celebration" },
  { id: "culinary", label: "Chef-led gastronomy" },
  { id: "pilgrimage", label: "Spiritual pilgrimage" },
  { id: "executive", label: "Executive retreat" },
];

const locationMultiplier: Record<string, number> = {
  jaffa: 1.08,
  haifa: 1.0,
  limassol: 1.18,
  athens: 1.32,
};

const travelStyleMultiplier: Record<string, number> = {
  sunset: 1.02,
  culinary: 1.12,
  pilgrimage: 1.05,
  executive: 1.18,
};

const squareBookingBaseUrl = "https://square.link/u/telavivyacht";

function generateInsights(
  locationId: string,
  vesselType: string,
  passengers: number,
  sailDate: string,
  travelStyleId: string,
  estimate: number,
) {
  const port = departurePorts.find((entry) => entry.id === locationId);
  const vessel = vesselCatalog[vesselType];
  const style = travelStyles.find((entry) => entry.id === travelStyleId);

  const month = sailDate ? new Date(sailDate).getUTCMonth() + 1 : undefined;
  const highSeason = month && (month >= 4 && month <= 7);

  const seasonalNote = highSeason
    ? "Peak Mediterranean light between April and July invites sunset receptions and waterfront arrivals into Tel Aviv Port."
    : "Off-peak sailings unlock calmer marinas and boutique hotel partnerships along the coast.";

  const capacityNote = passengers > vessel.capacity
    ? `The selected vessel comfortably sleeps ${vessel.capacity}. Consider a tandem charter or contacting us for a superyacht upgrade.`
    : `The ${vesselType.toLowerCase()} is ideal for parties up to ${vessel.capacity}, keeping service intimate and personalized.`;

  return [
    `AI concierge estimate: ₪${estimate.toLocaleString("en-US")} (±10%) including crew, fuel, and Tel Aviv arrival concierge.`,
    `${style?.label ?? "Voyage"} pairs beautifully with ${port?.scenicHighlight ?? "the Mediterranean horizon"}`,
    capacityNote,
    seasonalNote,
  ];
}

function App() {
  const [selectedLocationId, setSelectedLocationId] = useState(departurePorts[0].id);

  const availableVessels = useMemo(
    () => departurePorts.find((port) => port.id === selectedLocationId)?.vesselTypes ?? [],
    [selectedLocationId],
  );

  const [selectedVessel, setSelectedVessel] = useState(availableVessels[0] ?? "");

  useEffect(() => {
    if (!availableVessels.includes(selectedVessel)) {
      setSelectedVessel(availableVessels[0] ?? "");
    }
  }, [availableVessels, selectedVessel]);

  const [passengers, setPassengers] = useState(8);
  const [sailDate, setSailDate] = useState("");
  const [travelStyleId, setTravelStyleId] = useState(travelStyles[0].id);

  const estimate = useMemo(() => {
    if (!selectedVessel) {
      return 0;
    }

    const vesselProfile = vesselCatalog[selectedVessel];
    const locationFactor = locationMultiplier[selectedLocationId] ?? 1;
    const styleFactor = travelStyleMultiplier[travelStyleId] ?? 1;

    const month = sailDate ? new Date(sailDate).getUTCMonth() + 1 : undefined;
    const seasonalFactor = month && (month === 6 || month === 7 || month === 8) ? 1.15 : 1;

    const guestPremium = Math.max(passengers - vesselProfile.capacity, 0) * 320;
    const base = vesselProfile.baseRate * locationFactor * styleFactor * seasonalFactor + guestPremium;

    return Math.round(base / 10) * 10;
  }, [passengers, sailDate, selectedLocationId, selectedVessel, travelStyleId]);

  const insights = useMemo(
    () =>
      selectedVessel
        ? generateInsights(
            selectedLocationId,
            selectedVessel,
            passengers,
            sailDate,
            travelStyleId,
            estimate,
          )
        : [],
    [estimate, passengers, sailDate, selectedLocationId, selectedVessel, travelStyleId],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedVessel) {
      return;
    }

    const bookingUrl = new URL(squareBookingBaseUrl);
    bookingUrl.searchParams.set("location", selectedLocationId);
    bookingUrl.searchParams.set("vessel", selectedVessel);
    bookingUrl.searchParams.set("passengers", String(passengers));
    if (sailDate) {
      bookingUrl.searchParams.set("date", sailDate);
    }
    bookingUrl.searchParams.set("style", travelStyleId);

    window.open(bookingUrl.toString(), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="app-shell">
      <header className="hero" aria-labelledby="hero-heading">
        <div className="hero-overlay" aria-hidden="true" />
        <nav className="top-nav">
          <span className="brand">Tel Aviv Yacht</span>
          <div className="nav-links">
            <a href="#voyage-planner">Plan a voyage</a>
            <a href="#ai-insights">AI concierge</a>
            <a href="#skippers">Skippers</a>
          </div>
        </nav>
        <div className="hero-content">
          <h1 id="hero-heading">Life-changing voyages to Tel Aviv</h1>
          <p>
            Curated passages between Tel Aviv and the Mediterranean&apos;s most storied ports.
            We match discerning travelers with world-class skippers, bespoke hospitality,
            and concierge arrivals that keep you connected to the rhythm of the city.
          </p>
          <div className="hero-cta">
            <a className="primary" href="#voyage-planner">
              Start planning
            </a>
            <a className="secondary" href="#skippers">
              Skippers: list availability
            </a>
          </div>
        </div>
      </header>

      <main>
        <section id="voyage-planner" className="planner" aria-labelledby="planner-heading">
          <div className="section-header">
            <h2 id="planner-heading">Reserve your Tel Aviv voyage</h2>
            <p>
              Choose a departure port and vessel type to reveal tailored pricing. Our secure Square checkout will capture your
              reservation details and concierge team will confirm within hours.
            </p>
          </div>

          <div className="planner-grid">
            <div className="port-menu" role="list">
              {departurePorts.map((port) => (
                <button
                  key={port.id}
                  type="button"
                  role="listitem"
                  className={`port-card ${selectedLocationId === port.id ? "selected" : ""}`}
                  onClick={() => setSelectedLocationId(port.id)}
                  aria-pressed={selectedLocationId === port.id}
                >
                  <span className="port-name">{port.name}</span>
                  <span className="port-tagline">{port.tagline}</span>
                  <span className="port-vessels">
                    {port.vesselTypes.map((type) => (
                      <span key={type} className="chip">
                        {type}
                      </span>
                    ))}
                  </span>
                </button>
              ))}
            </div>

            <form className="booking-form" onSubmit={handleSubmit}>
              <div className="field-group">
                <label htmlFor="vessel">Vessel type</label>
                <select
                  id="vessel"
                  value={selectedVessel}
                  onChange={(event) => setSelectedVessel(event.target.value)}
                  required
                >
                  {availableVessels.length === 0 && <option value="">Select a departure port</option>}
                  {availableVessels.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {selectedVessel && (
                  <p className="field-hint">{vesselCatalog[selectedVessel].style}</p>
                )}
              </div>

              <div className="field-row">
                <div className="field-group">
                  <label htmlFor="sail-date">Target date</label>
                  <input
                    id="sail-date"
                    type="date"
                    value={sailDate}
                    onChange={(event) => setSailDate(event.target.value)}
                  />
                </div>
                <div className="field-group">
                  <label htmlFor="passengers">Guests</label>
                  <input
                    id="passengers"
                    type="number"
                    min={2}
                    max={24}
                    value={passengers}
                    onChange={(event) => setPassengers(Number(event.target.value))}
                  />
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="travel-style">Voyage energy</label>
                <select
                  id="travel-style"
                  value={travelStyleId}
                  onChange={(event) => setTravelStyleId(event.target.value)}
                >
                  {travelStyles.map((style) => (
                    <option key={style.id} value={style.id}>
                      {style.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="estimate-card" aria-live="polite">
                <p className="estimate-label">Estimated investment</p>
                <p className="estimate-value">₪{estimate.toLocaleString("en-US")}</p>
                <p className="estimate-subtext">
                  Based on AI pricing factors including vessel profile, seasonality, and concierge services. Final quote shared
                  after securing your Square reservation.
                </p>
              </div>

              <button className="reserve" type="submit">
                Continue to Square checkout
              </button>
            </form>
          </div>
        </section>

        <section id="ai-insights" className="insights" aria-labelledby="insights-heading">
          <div className="section-header">
            <h2 id="insights-heading">AI concierge guidance</h2>
            <p>
              Our in-house routing assistant blends live charter data, seasonal weather, and Tel Aviv hospitality partners to
              surface meaningful recommendations while you plan.
            </p>
          </div>

          <ul className="insight-list">
            {insights.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
            {insights.length === 0 && <li>Select a departure port and vessel to unlock tailored insights.</li>}
          </ul>
        </section>

        <section id="skippers" className="skipper-cta" aria-labelledby="skipper-heading">
          <div className="section-header">
            <h2 id="skipper-heading">Skippers &amp; owners — share your availability</h2>
            <p>
              Tel Aviv Yacht is curating a collective of master skippers and vessel owners who know the Levant intimately. Share
              your calendar, and we will connect you with transformational travelers seeking authentic passages.
            </p>
          </div>
          <div className="skipper-actions">
            <a
              className="primary"
              href="https://forms.gle/telavivyacht-skippers"
              target="_blank"
              rel="noreferrer"
            >
              List your availability
            </a>
            <a className="secondary" href="mailto:crew@telavivyacht.com">
              Crew concierge
            </a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <p>
          © {new Date().getFullYear()} Tel Aviv Yacht. Crafted for journeys that begin on deck and end in Tel Aviv&apos;s
          neighborhoods.
        </p>
        <p className="footer-links">
          <a href="mailto:sail@telavivyacht.com">sail@telavivyacht.com</a>
          <span aria-hidden="true">·</span>
          <a href="#voyage-planner">Plan</a>
          <a href="#skippers">Skippers</a>
        </p>
      </footer>
    </div>
  );
}

export default App;
