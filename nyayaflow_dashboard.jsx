import React, {
  useState,
  useMemo,
  useEffect,
} from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import {
  Scale,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Gavel,
  ArrowRight,
  ArrowDownRight,
  ArrowUpRight,
  Target,
  Info,
  Users,
  Calculator,
  ShieldCheck,
  Zap,
  ChevronRight,
} from "lucide-react";

/* ============================================================
   API
============================================================ */

const API_URL = "http://127.0.0.1:8000";


/* ============================================================
   DESIGN TOKENS
============================================================ */

const T = {
  ink: "#12161F",
  inkSoft: "#1B212C",
  paper: "#F6F3EC",
  paperDim: "#EDE8DB",

  brass: "#B8925A",
  brassDim: "#8A6D42",

  clay: "#B5502F",
  clayDim: "#8C3D24",

  teal: "#3E7568",
  tealDim: "#2E5A50",

  slate: "#5B6472",
  slateLight: "#9CA3AF",

  border: "#2A313E",
};

const serif = {
  fontFamily: "Georgia, 'Times New Roman', serif",
};

const mono = {
  fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
};


/* ============================================================
   HELPERS
============================================================ */

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN");

const getShortName = (district) => {
  return district
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

const API_BASE = "http://127.0.0.1:8000";

async function fetchReallocation() {
  const response = await fetch(
    `${API_BASE}/resource-reallocation`
  );

  if (!response.ok) {
    throw new Error(
      `Resource reallocation API failed: ${response.status}`
    );
  }

  return response.json();
}

/* ============================================================
   TRANSFORM API DATA
============================================================ */

function transformWorkloadData(data) {
  return data.map((d) => ({
    name: d.district,

    short: getShortName(d.district),

    totalPending: d.total_pending,

    casesPerJudge: d.cases_per_judge,

    oldCases: d.old_cases_est,

    criticalCases: d.critical_cases_est,

    civilPressure: d.civil_pressure_index,

    criminalPressure: d.criminal_pressure_index,

    workloadScore: d.workload_score,

    workloadLevel: d.workload_level,

    workloadRank: d.workload_rank,
  }));
}


/* ============================================================
   STATUS HELPERS
============================================================ */

function getStatusColor(level) {
  switch (level) {
    case "CRITICAL":
      return T.clay;

    case "HIGH":
      return T.brass;

    case "MODERATE":
      return T.brassDim;

    case "LOW":
      return T.teal;

    default:
      return T.slate;
  }
}

function getStatusTone(level) {
  switch (level) {
    case "CRITICAL":
      return "clay";

    case "HIGH":
    case "MODERATE":
      return "brass";

    case "LOW":
      return "teal";

    default:
      return "brass";
  }
}


/* ============================================================
   STAMP
============================================================ */

function Stamp({ label, tone }) {
  const colors = {
    clay: {
      border: T.clay,
      text: T.clay,
    },

    teal: {
      border: T.teal,
      text: T.teal,
    },

    brass: {
      border: T.brass,
      text: T.brassDim,
    },
  }[tone] || {
    border: T.slate,
    text: T.slate,
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,

        border: `2.5px solid ${colors.border}`,
        color: colors.text,

        padding: "6px 14px",

        borderRadius: 8,

        transform: "rotate(-2deg)",

        fontWeight: 800,
        fontSize: 14,

        letterSpacing: "0.08em",
        textTransform: "uppercase",

        opacity: 0.9,

        ...mono,
      }}
    >
      {label}
    </span>
  );
}


/* ============================================================
   CARD
============================================================ */

function Card({ children, style }) {
  return (
    <div
      style={{
        background: T.paper,

        borderRadius: 12,

        padding: 28,

        border: `1px solid ${T.paperDim}`,

        boxShadow:
          "0 2px 6px rgba(0,0,0,0.28)",

        ...style,
      }}
    >
      {children}
    </div>
  );
}


/* ============================================================
   SECTION LABEL
============================================================ */

function SectionLabel({ children }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",

        gap: 8,

        marginBottom: 14,
      }}
    >
      <div
        style={{
          width: 3,
          height: 16,

          background: T.brass,
        }}
      />

      <span
        style={{
          ...serif,

          fontSize: 15,

          letterSpacing: "0.06em",

          textTransform: "uppercase",

          color: T.slate,
        }}
      >
        {children}
      </span>
    </div>
  );
}


/* ============================================================
   STAT
============================================================ */

function Stat({
  label,
  value,
  sub,
  color,
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 13,

          color: T.slate,

          textTransform: "uppercase",

          letterSpacing: "0.05em",

          marginBottom: 4,
        }}
      >
        {label}
      </div>

      <div
        style={{
          ...mono,

          fontSize: 26,

          fontWeight: 700,

          color: color || T.ink,

          lineHeight: 1.1,
        }}
      >
        {value}
      </div>

      {sub && (
        <div
          style={{
            fontSize: 13,

            color: T.slate,

            marginTop: 3,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}


/* ============================================================
   WORKLOAD CARD
============================================================ */

function DistrictCard({ district }) {
  const statusColor = getStatusColor(
    district.workloadLevel
  );

  const statusTone = getStatusTone(
    district.workloadLevel
  );

  return (
    <Card>
      {/* Header */}

      <div
        style={{
          display: "flex",

          justifyContent: "space-between",

          alignItems: "flex-start",

          marginBottom: 18,
        }}
      >
        <div>
          <div
            style={{
              ...serif,

              fontSize: 21,

              fontWeight: 700,

              color: T.ink,
            }}
          >
            {district.name}
          </div>

          <div
            style={{
              fontSize: 13,

              color: T.slate,

              ...mono,

              marginTop: 3,
            }}
          >
            DISTRICT COURT · UP
          </div>
        </div>

        <Stamp
          label={district.workloadLevel}
          tone={statusTone}
        />
      </div>


      {/* Main statistics */}

      <div
        style={{
          display: "grid",

          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",

          gap: 22,

          marginBottom: 16,
        }}
      >
        <Stat
          label="Total pending"
          value={fmt(
            district.totalPending
          )}
        />

        <Stat
          label="Cases / judge"
          value={fmt(
            Math.round(
              district.casesPerJudge
            )
          )}
          color={
            district.casesPerJudge > 20000
              ? T.clay
              : T.ink
          }
        />

        <Stat
          label="Old cases"
          value={fmt(
            district.oldCases
          )}
        />

        <Stat
          label="Critical cases"
          value={fmt(
            district.criticalCases
          )}
        />
      </div>


      {/* Workload score */}

      <div
        style={{
          background: T.paperDim,

          borderRadius: 8,

          padding: 14,

          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",

            justifyContent: "space-between",

            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,

                color: T.slate,

                textTransform:
                  "uppercase",

                marginBottom: 5,
              }}
            >
              Workload score
            </div>

            <div
              style={{
                ...mono,

                fontSize: 36,

                fontWeight: 800,

                color: statusColor,
              }}
            >
              {Number(
                district.workloadScore
              ).toFixed(1)}
            </div>
          </div>

          <div
            style={{
              textAlign: "right",
            }}
          >
            <div
              style={{
                fontSize: 13,

                color: T.slate,
              }}
            >
              District rank
            </div>

            <div
              style={{
                ...mono,

                fontSize: 24,

                fontWeight: 700,

                color: T.ink,
              }}
            >
              #{district.workloadRank}
            </div>
          </div>
        </div>

        {/* Score bar */}

        <div
          style={{
            height: 12,

            background: "#D8D2C5",

            borderRadius: 10,

            overflow: "hidden",

            marginTop: 12,
          }}
        >
          <div
            style={{
              width: `${Math.min(
                100,
                Math.max(
                  0,
                  district.workloadScore
                )
              )}%`,

              height: "100%",

              background: statusColor,

              borderRadius: 10,

              transition:
                "width 0.4s ease",
            }}
          />
        </div>

        <div
          style={{
            fontSize: 13,
            color: T.slate,
            marginTop: 8,
            lineHeight: 1.5,
          }}
        >
          Higher score = more urgent backlog.
          Combines pending cases, case age
          and judge staffing.
        </div>
      </div>


      {/* Pressure */}

      <div
        style={{
          borderTop:
            `1px solid ${T.paperDim}`,

          paddingTop: 13,

          display: "grid",

          gridTemplateColumns:
            "1fr 1fr",

          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,

              color: T.slate,

              textTransform:
                "uppercase",

              marginBottom: 4,
            }}
          >
            Civil pressure
          </div>

          <div
            style={{
              ...mono,

              fontSize: 17,

              fontWeight: 700,

              color: T.ink,
            }}
          >
            {Number(
              district.civilPressure
            ).toFixed(3)}
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: 12,

              color: T.slate,

              textTransform:
                "uppercase",

              marginBottom: 4,
            }}
          >
            Criminal pressure
          </div>

          <div
            style={{
              ...mono,

              fontSize: 17,

              fontWeight: 700,

              color:
                district.criminalPressure >
                1
                  ? T.clay
                  : T.ink,
            }}
          >
            {Number(
              district.criminalPressure
            ).toFixed(3)}
          </div>
        </div>
      </div>
    </Card>
  );
}


/* ============================================================
   OVERVIEW
============================================================ */

function Overview({ districts }) {
  return (
    <div
      style={{
        display: "grid",

        gap: 22,
      }}
    >
      {/* How to read this */}

      <Card
        style={{
          background: T.paperDim,
          border: `1px solid #D8D2C5`,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 22,
          }}
        >
          <div>
            <div
              style={{
                ...mono,
                fontSize: 13,
                fontWeight: 700,
                color: T.brassDim,
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Workload score
            </div>
            <div style={{ fontSize: 14, color: T.ink, lineHeight: 1.55 }}>
              0–100. Higher means a court is more
              overwhelmed — lots of pending cases,
              many of them old, not enough judges.
            </div>
          </div>

          <div>
            <div
              style={{
                ...mono,
                fontSize: 13,
                fontWeight: 700,
                color: T.brassDim,
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Civil / criminal pressure
            </div>
            <div style={{ fontSize: 14, color: T.ink, lineHeight: 1.55 }}>
              Cases coming in vs. cases the court can
              clear. Above 1.0 means new cases are
              piling up faster than they're being
              resolved.
            </div>
          </div>
        </div>
      </Card>

      {/* District cards */}

      <div
        style={{
          display: "grid",

          gridTemplateColumns:
            "repeat(auto-fit, minmax(280px, 1fr))",

          gap: 22,
        }}
      >
        {districts.map(
          (district) => (
            <DistrictCard
              key={district.name}
              district={district}
            />
          )
        )}
      </div>


      {/* Workload chart */}

      <Card>
        <SectionLabel>
          Overall workload score — by district
        </SectionLabel>

        <ResponsiveContainer
          width="100%"
          height={280}
        >
          <BarChart
            data={districts}
            margin={{
              top: 25,
              right: 20,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid
              stroke={T.paperDim}
              vertical={false}
            />

            <XAxis
              dataKey="short"

              tick={{
                fill: T.slate,
                fontSize: 14,
              }}

              axisLine={{
                stroke: T.paperDim,
              }}

              tickLine={false}
            />

            <YAxis
              domain={[0, 100]}

              tick={{
                fill: T.slate,
                fontSize: 13,
              }}

              axisLine={false}

              tickLine={false}
            />

            <Tooltip
              cursor={{
                fill: T.paperDim,
              }}

              contentStyle={{
                background: T.ink,

                border: "none",

                borderRadius: 8,

                color: T.paper,

                fontSize: 14,
              }}

              formatter={(value) => [
                Number(value).toFixed(2),
                "Workload score",
              ]}

              labelFormatter={(_, payload) =>
                payload && payload[0]
                  ? payload[0].payload.name
                  : ""
              }
            />

            <Bar
              dataKey="workloadScore"

              radius={[
                4,
                4,
                0,
                0,
              ]}

              barSize={70}
            >
              {districts.map(
                (district, index) => (
                  <Cell
                    key={index}
                    fill={getStatusColor(
                      district.workloadLevel
                    )}
                  />
                )
              )}

              <LabelList
                dataKey="workloadScore"

                position="top"

                formatter={(value) =>
                  Number(value).toFixed(
                    1
                  )
                }

                style={{
                  fill: T.ink,

                  fontSize: 13,

                  ...mono,
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px 16px",
            marginTop: 12,
            paddingTop: 12,
            borderTop: `1px solid ${T.paperDim}`,
          }}
        >
          {districts.map((d) => (
            <div
              key={d.name}
              style={{
                fontSize: 13,
                color: T.slate,
                ...mono,
              }}
            >
              <b style={{ color: T.ink }}>{d.short}</b> = {d.name}
            </div>
          ))}
        </div>

        <p
          style={{
            fontSize: 13,

            color: T.slate,

            marginTop: 10,

            lineHeight: 1.5,
          }}
        >
          Higher bar = more urgent backlog. The score
          combines how many cases are pending, how old
          they are, and how many judges are handling them —
          worked out by the NyayaFlow Python pipeline.
        </p>
      </Card>


      {/* Important signal */}

      <Card>
        <SectionLabel>
          Judicial workload signals
        </SectionLabel>

        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",

            gap: 16,
          }}
        >
          {districts.map(
            (district) => {
              const critical =
                district.workloadLevel ===
                "CRITICAL";

              return (
                <div
                  key={district.name}
                  style={{
                    padding: 14,

                    background:
                      T.paperDim,

                    borderRadius: 8,

                    display: "flex",

                    gap: 10,

                    alignItems:
                      "flex-start",
                  }}
                >
                  {critical ? (
                    <AlertTriangle
                      size={20}
                      color={T.clay}
                    />
                  ) : (
                    <CheckCircle2
                      size={20}
                      color={T.teal}
                    />
                  )}

                  <div>
                    <div
                      style={{
                        ...serif,

                        fontSize: 16,

                        fontWeight: 700,

                        color: T.ink,

                        marginBottom: 4,
                      }}
                    >
                      {district.name}
                    </div>

                    <div
                      style={{
                        fontSize: 13,

                        color: T.slate,

                        lineHeight: 1.5,
                      }}
                    >
                      Workload level:{" "}
                      <b
                        style={{
                          color:
                            getStatusColor(
                              district.workloadLevel
                            ),
                        }}
                      >
                        {district.workloadLevel}
                      </b>

                      <br />

                      Rank: #
                      {
                        district.workloadRank
                      }
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </Card>
    </div>
  );
}
 

/* ============================================================
   REALLOCATION ANALYSIS HELPERS
============================================================ */

function getPressurePriority(civil, criminal) {
  if (criminal > 1 && criminal > civil) {
    return {
      stream: "criminal",
      label: "Prioritize criminal capacity",
      color: T.clay,
      reason:
        "Criminal workload is carrying the stronger pressure signal.",
    };
  }

  if (civil > 1 && civil > criminal) {
    return {
      stream: "civil",
      label: "Prioritize civil capacity",
      color: T.brass,
      reason:
        "Civil workload is carrying the stronger pressure signal.",
    };
  }

  if (criminal > 1) {
    return {
      stream: "criminal",
      label: "Criminal pressure is elevated",
      color: T.clay,
      reason:
        "Criminal pressure is above the 1.0 pressure threshold.",
    };
  }

  if (civil > 1) {
    return {
      stream: "civil",
      label: "Civil pressure is elevated",
      color: T.brass,
      reason:
        "Civil pressure is above the 1.0 pressure threshold.",
    };
  }

  return {
    stream: "balanced",
    label: "No strong reallocation signal",
    color: T.teal,
    reason:
      "Neither stream shows a dominant pressure signal.",
  };
}


function percentageChange(before, after) {
  if (!before) return 0;

  return ((after - before) / before) * 100;
}


function formatChange(before, after) {
  const change = percentageChange(before, after);

  if (Math.abs(change) < 0.05) {
    return "No meaningful change";
  }

  return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
}


function getChangeColor(before, after) {
  if (after < before) return T.teal;
  if (after > before) return T.clay;

  return T.slate;
}


function getInterventionQuality(
  civilBefore,
  civilAfter,
  criminalBefore,
  criminalAfter
) {
  const civilChange =
    percentageChange(civilBefore, civilAfter);

  const criminalChange =
    percentageChange(
      criminalBefore,
      criminalAfter
    );

  /*
   * A useful intervention should reduce the
   * overloaded stream.
   */
  if (
    criminalBefore > 1 &&
    criminalAfter < criminalBefore &&
    civilAfter <= civilBefore * 1.1
  ) {
    return {
      label: "FAVOURABLE",
      tone: "teal",
      icon: ShieldCheck,
      description:
        "The intervention reduces criminal pressure while keeping the civil-side increase relatively limited.",
    };
  }

  if (
    civilBefore > 1 &&
    civilAfter < civilBefore &&
    criminalAfter <= criminalBefore * 1.1
  ) {
    return {
      label: "FAVOURABLE",
      tone: "teal",
      icon: ShieldCheck,
      description:
        "The intervention reduces civil pressure while keeping the criminal-side increase relatively limited.",
    };
  }

  if (
    criminalChange < 0 ||
    civilChange < 0
  ) {
    return {
      label: "MIXED",
      tone: "brass",
      icon: Info,
      description:
        "The intervention improves one pressure signal but introduces a measurable trade-off in another.",
    };
  }

  return {
    label: "REVIEW",
    tone: "clay",
    icon: AlertTriangle,
    description:
      "The simulated movement does not currently show a clear pressure reduction.",
    };
}

function SimulationMetric({
  label,
  before,
  after,
  inverse = false,
  decimals = 0,
}) {
  const delta =
    Number(after) - Number(before);

  const improved =
    inverse
      ? delta < 0
      : delta > 0;

  const formatValue = (value) => {
    if (decimals > 0) {
      return Number(value).toFixed(
        decimals
      );
    }

    return fmt(
      Math.round(Number(value))
    );
  };

  const percentage =
    Number(before) !== 0
      ? (delta / Number(before)) * 100
      : 0;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "180px 1fr auto",
        alignItems: "center",
        gap: 22,
        padding: "14px 16px",
        background: T.paperDim,
        borderRadius: 8,
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: T.slate,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          ...mono,
        }}
      >
        <span
          style={{
            fontSize: 21,
            fontWeight: 700,
            color: T.ink,
          }}
        >
          {formatValue(before)}
        </span>

        <ChevronRight
          size={17}
          color={T.slate}
        />

        <span
          style={{
            fontSize: 24,
            fontWeight: 800,
            color:
              improved
                ? T.teal
                : delta === 0
                ? T.slate
                : T.clay,
          }}
        >
          {formatValue(after)}
        </span>
      </div>

      <div
        style={{
          ...mono,
          fontSize: 13,
          fontWeight: 700,
          color:
            improved
              ? T.teal
              : delta === 0
              ? T.slate
              : T.clay,
          textAlign: "right",
        }}
      >
        {delta > 0 ? "+" : ""}
        {percentage.toFixed(1)}%
      </div>
    </div>
  );
}


function ImpactCard({
  label,
  value,
  description,
  positive,
}) {
  return (
    <div
      style={{
        padding: 18,
        border:
          `1px solid ${T.paperDim}`,
        borderRadius: 8,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: T.slate,
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {label}
      </div>

      <div
        style={{
          ...mono,
          fontSize: 30,
          fontWeight: 800,
          color: positive
            ? T.teal
            : T.clay,
        }}
      >
        {value}
      </div>

      <div
        style={{
          fontSize: 13,
          color: T.slate,
          marginTop: 5,
        }}
      >
        {description}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   TAB: REALLOCATION
   Data comes from FastAPI /resource-reallocation

   Moved out of NyayaFlowDashboard's body (was nested + never rendered,
   and was missing the ChevronRight import) so it is now a proper
   top-level component that the tab switcher below can mount.
--------------------------------------------------------------------- */

/* ============================================================
   REALLOCATION
   Decision-support view based on FastAPI output
============================================================ */

function Reallocation() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/resource-reallocation`
      );

      if (!response.ok) {
        throw new Error(
          `Resource API returned ${response.status}`
        );
      }

      const result = await response.json();

      console.log(
        "NyayaFlow reallocation API:",
        result
      );

      setData(result);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to load resource reallocation data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <Card>
        <div
          style={{
            textAlign: "center",
            padding: 60,
          }}
        >
          <Activity
            size={32}
            color={T.brass}
            style={{
              marginBottom: 12,
            }}
          />

          <div
            style={{
              ...mono,
              fontSize: 16,
              color: T.ink,
            }}
          >
            Analysing resource pressure...
          </div>

          <div
            style={{
              fontSize: 13,
              color: T.slate,
              marginTop: 6,
            }}
          >
            Comparing civil and criminal workload
          </div>
        </div>
      </Card>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (error) {
    return (
      <Card>
        <div
          style={{
            textAlign: "center",
            padding: 50,
          }}
        >
          <AlertTriangle
            size={32}
            color={T.clay}
            style={{
              marginBottom: 12,
            }}
          />

          <div
            style={{
              ...serif,
              fontSize: 24,
              fontWeight: 700,
              color: T.ink,
              marginBottom: 8,
            }}
          >
            Resource API unavailable
          </div>

          <div
            style={{
              fontSize: 14,
              color: T.slate,
              marginBottom: 18,
            }}
          >
            {error}
          </div>

          <button
            onClick={loadData}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 14px",
              border: "none",
              borderRadius: 8,
              background: T.brass,
              color: T.paper,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card>
        <div
          style={{
            textAlign: "center",
            padding: 50,
            color: T.slate,
          }}
        >
          No resource reallocation data available.
        </div>
      </Card>
    );
  }

  /* ==========================================================
     SUMMARY
  ========================================================== */

  const totalMoves = data.reduce(
    (sum, d) =>
      sum +
      Number(
        d.resources_moved ??
          d.candidate_resources ??
          d.reallocate_n_courts ??
          0
      ),
    0
  );

  const criminalPriorityCount =
    data.filter((d) => {
      const civil = Number(
        d.civil_pressure_index ?? 0
      );

      const criminal = Number(
        d.criminal_pressure_index ?? 0
      );

      return criminal > 1 && criminal > civil;
    }).length;

  return (
    <div
      style={{
        display: "grid",
        gap: 22,
      }}
    >

      {/* ======================================================
          HEADER
      ====================================================== */}

      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 26,
            flexWrap: "wrap",
          }}
        >
          <div>
            <SectionLabel>
              Resource reallocation intelligence
            </SectionLabel>

            <div
              style={{
                ...serif,
                fontSize: 24,
                fontWeight: 700,
                color: T.ink,
                marginBottom: 7,
              }}
            >
              Where should court capacity move?
            </div>

            <div
              style={{
                fontSize: 14,
                color: T.slate,
                lineHeight: 1.6,
                maxWidth: 680,
              }}
            >
              NyayaFlow compares civil and criminal
              pressure within each district and evaluates
              the expected trade-off from moving available
              resources.
            </div>
          </div>

          <button
            onClick={loadData}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              border:
                `1px solid ${T.paperDim}`,
              background: T.paperDim,
              color: T.ink,
              padding: "8px 13px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
              ...mono,
              fontWeight: 700,
            }}
          >
            <RefreshCw size={15} />
            Refresh Analysis
          </button>
        </div>
      </Card>


      {/* ======================================================
          SYSTEM SUMMARY
      ====================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 16,
        }}
      >

        <Card>
          <Stat
            label="Districts analysed"
            value={data.length}
            sub="Current API dataset"
          />
        </Card>

        <Card>
          <Stat
            label="Resources identified"
            value={totalMoves}
            sub="Across analysed districts"
          />
        </Card>

        <Card>
          <Stat
            label="Criminal-priority districts"
            value={criminalPriorityCount}
            sub="Pressure > 1.0 and dominant"
            color={
              criminalPriorityCount > 0
                ? T.clay
                : T.teal
            }
          />
        </Card>

      </div>


      {/* ======================================================
          DISTRICT ANALYSIS
      ====================================================== */}

      {data.map((d) => {

        const civilBefore = Number(
          d.civil_pressure_index ?? 0
        );

        const criminalBefore = Number(
          d.criminal_pressure_index ?? 0
        );

        const civilAfter = Number(
          d.civil_pressure_after ??
            d.civil_pressure_after_reallocation ??
            civilBefore
        );

        const criminalAfter = Number(
          d.criminal_pressure_after ??
            d.criminal_pressure_after_reallocation ??
            criminalBefore
        );

        const resourcesMoved = Number(
          d.resources_moved ??
            d.candidate_resources ??
            d.reallocate_n_courts ??
            0
        );

        const priority = getPressurePriority(
          civilBefore,
          criminalBefore
        );

        const quality =
          getInterventionQuality(
            civilBefore,
            civilAfter,
            criminalBefore,
            criminalAfter
          );

        const QualityIcon = quality.icon;

        const civilChange =
          percentageChange(
            civilBefore,
            civilAfter
          );

        const criminalChange =
          percentageChange(
            criminalBefore,
            criminalAfter
          );

        return (
          <Card key={d.district}>

            {/* ==================================================
                DISTRICT HEADER
            ================================================== */}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 15,
                marginBottom: 20,
              }}
            >

              <div>
                <div
                  style={{
                    ...serif,
                    fontSize: 25,
                    fontWeight: 700,
                    color: T.ink,
                  }}
                >
                  {d.district}
                </div>

                <div
                  style={{
                    ...mono,
                    fontSize: 12,
                    color: T.slate,
                    marginTop: 4,
                  }}
                >
                  DISTRICT RESOURCE ANALYSIS · UP
                </div>
              </div>

              <Stamp
                label={
                  resourcesMoved > 0
                    ? `Move ${resourcesMoved}`
                    : "No Move"
                }
                tone={
                  resourcesMoved > 0
                    ? "brass"
                    : "teal"
                }
              />

            </div>


            {/* ==================================================
                WHY?
            ================================================== */}

            <div
              style={{
                background: T.paperDim,
                borderRadius: 8,
                padding: 16,
                marginBottom: 16,
                borderLeft:
                  `4px solid ${priority.color}`,
              }}
            >

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <Target
                  size={19}
                  color={priority.color}
                />

                <span
                  style={{
                    ...mono,
                    fontSize: 13,
                    fontWeight: 700,
                    color: priority.color,
                    textTransform: "uppercase",
                    letterSpacing:
                      "0.05em",
                  }}
                >
                  Decision signal
                </span>
              </div>

              <div
                style={{
                  ...serif,
                  fontSize: 20,
                  fontWeight: 700,
                  color: T.ink,
                  marginBottom: 5,
                }}
              >
                {priority.label}
              </div>

              <div
                style={{
                  fontSize: 14,
                  color: T.slate,
                  lineHeight: 1.6,
                }}
              >
                {priority.reason}
              </div>

            </div>


            {/* ==================================================
                PRESSURE COMPARISON
            ================================================== */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(250px, 1fr))",
                gap: 18,
                marginBottom: 16,
              }}
            >

              {/* CIVIL */}

              <div
                style={{
                  background: T.paperDim,
                  borderRadius: 8,
                  padding: 17,
                }}
              >

                <div
                  style={{
                    fontSize: 12,
                    color: T.slate,
                    textTransform:
                      "uppercase",
                    marginBottom: 10,
                  }}
                >
                  Civil pressure
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                  }}
                >

                  <span
                    style={{
                      ...mono,
                      fontSize: 26,
                      fontWeight: 700,
                      color: T.ink,
                    }}
                  >
                    {civilBefore.toFixed(3)}
                  </span>

                  <ChevronRight
                    size={18}
                    color={T.slate}
                  />

                  <span
                    style={{
                      ...mono,
                      fontSize: 26,
                      fontWeight: 700,
                      color:
                        getChangeColor(
                          civilBefore,
                          civilAfter
                        ),
                    }}
                  >
                    {civilAfter.toFixed(3)}
                  </span>

                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    marginTop: 7,
                    fontSize: 13,
                    color:
                      getChangeColor(
                        civilBefore,
                        civilAfter
                      ),
                  }}
                >

                  {civilAfter <
                  civilBefore ? (
                    <ArrowDownRight
                      size={16}
                    />
                  ) : civilAfter >
                    civilBefore ? (
                    <ArrowUpRight
                      size={16}
                    />
                  ) : null}

                  {formatChange(
                    civilBefore,
                    civilAfter
                  )}

                </div>

              </div>


              {/* CRIMINAL */}

              <div
                style={{
                  background: T.paperDim,
                  borderRadius: 8,
                  padding: 17,
                }}
              >

                <div
                  style={{
                    fontSize: 12,
                    color: T.slate,
                    textTransform:
                      "uppercase",
                    marginBottom: 10,
                  }}
                >
                  Criminal pressure
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                  }}
                >

                  <span
                    style={{
                      ...mono,
                      fontSize: 26,
                      fontWeight: 700,
                      color:
                        criminalBefore > 1
                          ? T.clay
                          : T.ink,
                    }}
                  >
                    {criminalBefore.toFixed(3)}
                  </span>

                  <ChevronRight
                    size={18}
                    color={T.slate}
                  />

                  <span
                    style={{
                      ...mono,
                      fontSize: 26,
                      fontWeight: 700,
                      color:
                        getChangeColor(
                          criminalBefore,
                          criminalAfter
                        ),
                    }}
                  >
                    {criminalAfter.toFixed(3)}
                  </span>

                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    marginTop: 7,
                    fontSize: 13,
                    color:
                      getChangeColor(
                        criminalBefore,
                        criminalAfter
                      ),
                  }}
                >

                  {criminalAfter <
                  criminalBefore ? (
                    <ArrowDownRight
                      size={16}
                    />
                  ) : criminalAfter >
                    criminalBefore ? (
                    <ArrowUpRight
                      size={16}
                    />
                  ) : null}

                  {formatChange(
                    criminalBefore,
                    criminalAfter
                  )}

                </div>

              </div>

            </div>


            {/* ==================================================
                IMPACT SUMMARY
            ================================================== */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(190px, 1fr))",
                gap: 10,
                marginBottom: 16,
              }}
            >

              <div
                style={{
                  padding: 13,
                  border:
                    `1px solid ${T.paperDim}`,
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: T.slate,
                    textTransform:
                      "uppercase",
                    marginBottom: 5,
                  }}
                >
                  Criminal impact
                </div>

                <div
                  style={{
                    ...mono,
                    fontWeight: 700,
                    color:
                      criminalChange < 0
                        ? T.teal
                        : T.clay,
                  }}
                >
                  {criminalChange > 0
                    ? "+"
                    : ""}
                  {criminalChange.toFixed(1)}%
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: T.slate,
                    marginTop: 3,
                  }}
                >
                  pressure change
                </div>
              </div>


              <div
                style={{
                  padding: 13,
                  border:
                    `1px solid ${T.paperDim}`,
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: T.slate,
                    textTransform:
                      "uppercase",
                    marginBottom: 5,
                  }}
                >
                  Civil impact
                </div>

                <div
                  style={{
                    ...mono,
                    fontWeight: 700,
                    color:
                      civilChange < 0
                        ? T.teal
                        : T.clay,
                  }}
                >
                  {civilChange > 0
                    ? "+"
                    : ""}
                  {civilChange.toFixed(1)}%
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: T.slate,
                    marginTop: 3,
                  }}
                >
                  pressure change
                </div>
              </div>


              <div
                style={{
                  padding: 13,
                  border:
                    `1px solid ${T.paperDim}`,
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: T.slate,
                    textTransform:
                      "uppercase",
                    marginBottom: 5,
                  }}
                >
                  Intervention
                </div>

                <div
                  style={{
                    ...mono,
                    fontWeight: 700,
                    color:
                      resourcesMoved > 0
                        ? T.brassDim
                        : T.teal,
                  }}
                >
                  {resourcesMoved > 0
                    ? `${resourcesMoved} unit${
                        resourcesMoved > 1
                          ? "s"
                          : ""
                      }`
                    : "None"}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: T.slate,
                    marginTop: 3,
                  }}
                >
                  recommended movement
                </div>
              </div>

            </div>


            {/* ==================================================
                INTERVENTION QUALITY
            ================================================== */}

            <div
              style={{
                padding: 15,
                background:
                  quality.tone === "teal"
                    ? "#E5EEE9"
                    : quality.tone === "brass"
                    ? "#EFE8D8"
                    : "#F1E1DA",
                borderRadius: 8,
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >

              <QualityIcon
                size={21}
                color={
                  quality.tone === "teal"
                    ? T.teal
                    : quality.tone === "brass"
                    ? T.brassDim
                    : T.clay
                }
              />

              <div>

                <div
                  style={{
                    ...mono,
                    fontSize: 13,
                    fontWeight: 800,
                    letterSpacing:
                      "0.05em",
                    color:
                      quality.tone === "teal"
                        ? T.tealDim
                        : quality.tone === "brass"
                        ? T.brassDim
                        : T.clayDim,
                    marginBottom: 4,
                  }}
                >
                  {quality.label}
                </div>

                <div
                  style={{
                    fontSize: 14,
                    color: T.ink,
                    lineHeight: 1.55,
                  }}
                >
                  {quality.description}
                </div>

              </div>

            </div>


            {/* ==================================================
                RECOMMENDATION
            ================================================== */}

            <div
              style={{
                marginTop: 14,
                padding: "13px 15px",
                background: T.paperDim,
                borderRadius: 8,
                fontSize: 14,
                color: T.ink,
                lineHeight: 1.6,
              }}
            >

              <b>
                Recommended action:
              </b>{" "}

              {resourcesMoved > 0 ? (
                <>
                  Consider reallocating{" "}
                  <b>
                    {resourcesMoved}
                  </b>{" "}
                  court/resource unit
                  {resourcesMoved > 1
                    ? "s"
                    : ""}{" "}
                  toward the{" "}
                  <b
                    style={{
                      color:
                        priority.color,
                    }}
                  >
                    {priority.stream}
                  </b>{" "}
                  workload.
                </>
              ) : (
                <>
                  No immediate resource
                  movement is indicated by
                  the current pressure signals.
                </>
              )}

              <div
                style={{
                  marginTop: 7,
                  fontSize: 13,
                  color: T.slate,
                  fontStyle: "italic",
                }}
              >
                This is a prototype
                decision-support signal.
                It does not constitute a
                judicial or administrative
                directive.
              </div>

            </div>

          </Card>
        );
      })}


      {/* ======================================================
          METHODOLOGY
      ====================================================== */}

      <Card>

        <SectionLabel>
          How NyayaFlow makes the recommendation
        </SectionLabel>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 18,
          }}
        >

          <div>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <Target
                size={18}
                color={T.brass}
              />

              <b
                style={{
                  fontSize: 14,
                  color: T.ink,
                }}
              >
                1. Detect pressure
              </b>
            </div>

            <div
              style={{
                fontSize: 13,
                color: T.slate,
                lineHeight: 1.5,
              }}
            >
              Compare civil and criminal
              pressure indices for each
              district.
            </div>
          </div>


          <div>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <ArrowRight
                size={18}
                color={T.brass}
              />

              <b
                style={{
                  fontSize: 14,
                  color: T.ink,
                }}
              >
                2. Identify priority
              </b>
            </div>

            <div
              style={{
                fontSize: 13,
                color: T.slate,
                lineHeight: 1.5,
              }}
            >
              The stream with the stronger
              pressure signal becomes the
              candidate for additional
              capacity.
            </div>
          </div>


          <div>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <Zap
                size={18}
                color={T.brass}
              />

              <b
                style={{
                  fontSize: 14,
                  color: T.ink,
                }}
              >
                3. Evaluate trade-off
              </b>
            </div>

            <div
              style={{
                fontSize: 13,
                color: T.slate,
                lineHeight: 1.5,
              }}
            >
              The before/after pressure
              values reveal whether the
              intervention helps or creates
              additional pressure elsewhere.
            </div>
          </div>

        </div>

      </Card>

    </div>
  );
}


/* ============================================================
   WHAT-IF SIMULATOR
============================================================ */

function WhatIf({ districts }) {
  const [districtName, setDistrictName] = useState("");
  const [additionalJudges, setAdditionalJudges] = useState(5);
  const [allocation, setAllocation] = useState("criminal");
  const [days, setDays] = useState(15);

  /*
   * Prototype assumption:
   *
   * We do NOT claim that every judge disposes a fixed number
   * of cases in real courts.
   *
   * For this prototype we estimate additional disposal capacity
   * from the district's current cases-per-judge figure.
   *
   * This makes the simulator explainable and keeps the calculation
   * tied to the workload dataset.
   */

  useEffect(() => {
    if (
      districts.length > 0 &&
      !districtName
    ) {
      setDistrictName(districts[0].name);
    }
  }, [districts, districtName]);

  const district = districts.find(
    (d) => d.name === districtName
  );

  const simulation = useMemo(() => {
    if (!district) {
      return null;
    }

    const currentPending =
      Number(district.totalPending || 0);

    const currentJudges =
      Number(district.casesPerJudge > 0
        ? currentPending / district.casesPerJudge
        : 0);

    /*
     * How many of the additional judges work on each stream.
     */
    let civilJudges = 0;
    let criminalJudges = 0;

    if (allocation === "civil") {
      civilJudges = additionalJudges;
    } else if (allocation === "criminal") {
      criminalJudges = additionalJudges;
    } else {
      civilJudges =
        Math.floor(additionalJudges / 2);

      criminalJudges =
        additionalJudges -
        civilJudges;
    }

    /*
     * Prototype daily capacity estimate.
     *
     * We use 1 / current cases-per-judge as a relative
     * workload-capacity factor rather than claiming that
     * a judge actually disposes this many cases per day.
     *
     * To make the result useful for the demo, we use a
     * conservative prototype disposal factor.
     */
    const prototypeDailyDisposalRate = 20;

    const additionalDailyCapacity =
      additionalJudges *
      prototypeDailyDisposalRate;

    const additionalDisposed =
      additionalDailyCapacity *
      days;

    const projectedPending = Math.max(
      0,
      currentPending -
        additionalDisposed
    );

    const pendingReduction =
      currentPending > 0
        ? (additionalDisposed /
            currentPending) *
          100
        : 0;

    const currentCasesPerJudge =
      Number(
        district.casesPerJudge || 0
      );

    const projectedJudges =
      currentJudges +
      additionalJudges;

    const projectedCasesPerJudge =
      projectedJudges > 0
        ? projectedPending /
          projectedJudges
        : currentCasesPerJudge;

    /*
     * Estimate stream-specific pressure.
     *
     * We reduce the selected stream's pressure
     * proportionally to the number of new judges.
     */
    const civilPressure =
      Number(
        district.civilPressure || 0
      );

    const criminalPressure =
      Number(
        district.criminalPressure || 0
      );

    const civilReduction =
      allocation === "civil"
        ? additionalJudges /
          Math.max(
            1,
            currentJudges
          )
        : allocation === "both"
        ? civilJudges /
          Math.max(
            1,
            currentJudges
          )
        : 0;

    const criminalReduction =
      allocation === "criminal"
        ? additionalJudges /
          Math.max(
            1,
            currentJudges
          )
        : allocation === "both"
        ? criminalJudges /
          Math.max(
            1,
            currentJudges
          )
        : 0;

    const projectedCivilPressure =
      Math.max(
        0,
        civilPressure *
          (1 - civilReduction)
      );

    const projectedCriminalPressure =
      Math.max(
        0,
        criminalPressure *
          (1 - criminalReduction)
      );

    return {
      currentPending,
      projectedPending,

      currentJudges,
      projectedJudges,

      currentCasesPerJudge,
      projectedCasesPerJudge,

      additionalDailyCapacity,
      additionalDisposed,

      pendingReduction,

      civilJudges,
      criminalJudges,

      civilPressure,
      projectedCivilPressure,

      criminalPressure,
      projectedCriminalPressure,
    };
  }, [
    district,
    additionalJudges,
    allocation,
    days,
  ]);

  if (!districts.length) {
    return (
      <Card>
        <div
          style={{
            padding: 50,
            textAlign: "center",
            color: T.slate,
          }}
        >
          Workload data is required before
          running the simulator.
        </div>
      </Card>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: 22,
      }}
    >

      {/* ======================================================
          HEADER
      ====================================================== */}

      <Card>
        <SectionLabel>
          What-if decision simulator
        </SectionLabel>

        <div
          style={{
            ...serif,
            fontSize: 34,
            fontWeight: 700,
            color: T.ink,
            marginBottom: 8,
          }}
        >
          What happens if we add more capacity?
        </div>

        <p
          style={{
            fontSize: 14,
            color: T.slate,
            lineHeight: 1.6,
            maxWidth: 760,
            margin: 0,
          }}
        >
          Simulate a staffing intervention and compare
          the projected workload against the current
          district position.
        </p>
      </Card>


      {/* ======================================================
          CONTROLS
      ====================================================== */}

      <Card>
        <SectionLabel>
          Simulation parameters
        </SectionLabel>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 26,
          }}
        >

          {/* District */}

          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                color: T.slate,
                textTransform: "uppercase",
                marginBottom: 7,
              }}
            >
              District
            </label>

            <select
              value={districtName}
              onChange={(e) =>
                setDistrictName(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border:
                  `1px solid ${T.paperDim}`,
                background: T.paperDim,
                color: T.ink,
                fontSize: 15,
                ...mono,
              }}
            >
              {districts.map((d) => (
                <option
                  key={d.name}
                  value={d.name}
                >
                  {d.name}
                </option>
              ))}
            </select>
          </div>


          {/* Allocation */}

          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                color: T.slate,
                textTransform: "uppercase",
                marginBottom: 7,
              }}
            >
              Assign additional judges to
            </label>

            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              {[
                ["civil", "Civil"],
                ["criminal", "Criminal"],
                ["both", "Both"],
              ].map(([value, label]) => {
                const active =
                  allocation === value;

                return (
                  <button
                    key={value}
                    onClick={() =>
                      setAllocation(value)
                    }
                    style={{
                      padding:
                        "9px 13px",
                      borderRadius: 8,
                      border:
                        `1px solid ${
                          active
                            ? T.brass
                            : T.paperDim
                        }`,
                      background:
                        active
                          ? T.brass
                          : "transparent",
                      color:
                        active
                          ? T.paper
                          : T.slate,
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>


          {/* Days */}

          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                color: T.slate,
                textTransform: "uppercase",
                marginBottom: 7,
              }}
            >
              Simulation period
            </label>

            <div
              style={{
                display: "flex",
                gap: 6,
              }}
            >
              {[7, 15, 30].map((value) => {
                const active =
                  days === value;

                return (
                  <button
                    key={value}
                    onClick={() =>
                      setDays(value)
                    }
                    style={{
                      padding:
                        "9px 14px",
                      borderRadius: 8,
                      border:
                        `1px solid ${
                          active
                            ? T.teal
                            : T.paperDim
                        }`,
                      background:
                        active
                          ? T.teal
                          : "transparent",
                      color:
                        active
                          ? T.paper
                          : T.slate,
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 700,
                      ...mono,
                    }}
                  >
                    {value} days
                  </button>
                );
              })}
            </div>
          </div>
        </div>


        {/* Judges slider */}

        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: T.paperDim,
            borderRadius: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: T.slate,
                textTransform:
                  "uppercase",
              }}
            >
              Additional judges
            </div>

            <div
              style={{
                ...mono,
                fontSize: 26,
                fontWeight: 800,
                color: T.brassDim,
              }}
            >
              +{additionalJudges}
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="20"
            step="1"
            value={additionalJudges}
            onChange={(e) =>
              setAdditionalJudges(
                Number(e.target.value)
              )
            }
            style={{
              width: "100%",
              accentColor: T.brass,
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              fontSize: 12,
              color: T.slate,
              marginTop: 5,
              ...mono,
            }}
          >
            <span>0</span>
            <span>5</span>
            <span>10</span>
            <span>15</span>
            <span>20</span>
          </div>
        </div>
      </Card>


      {/* ======================================================
          INTERVENTION SUMMARY
      ====================================================== */}

      {simulation && (
        <Card>
          <SectionLabel>
            Intervention summary
          </SectionLabel>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
            }}
          >

            <Stat
              label="Current judges"
              value={Math.round(
                simulation.currentJudges
              )}
            />

            <Stat
              label="Projected judges"
              value={Math.round(
                simulation.projectedJudges
              )}
              color={T.teal}
            />

            <Stat
              label="Simulation period"
              value={`${days} days`}
            />

            <Stat
              label="Estimated additional disposal"
              value={fmt(
                Math.round(
                  simulation.additionalDisposed
                )
              )}
              color={T.teal}
            />
          </div>

          <div
            style={{
              marginTop: 16,
              padding: "12px 14px",
              background: T.paperDim,
              borderRadius: 8,
              fontSize: 13,
              color: T.slate,
              lineHeight: 1.6,
            }}
          >
            <b
              style={{
                color: T.ink,
              }}
            >
              Intervention:
            </b>{" "}
            +{additionalJudges} judge
            {additionalJudges !== 1
              ? "s"
              : ""}{" "}
            assigned to{" "}
            <b
              style={{
                color:
                  allocation === "criminal"
                    ? T.clay
                    : allocation === "civil"
                    ? T.brassDim
                    : T.teal,
              }}
            >
              {allocation}
            </b>{" "}
            capacity for{" "}
            <b>{days} days</b>.
          </div>
        </Card>
      )}


      {/* ======================================================
          BEFORE / AFTER
      ====================================================== */}

      {simulation && (
        <Card>
          <SectionLabel>
            Current vs projected workload
          </SectionLabel>

          <div
            style={{
              display: "grid",
              gap: 16,
            }}
          >

            <SimulationMetric
              label="Pending cases"
              before={
                simulation.currentPending
              }
              after={
                simulation.projectedPending
              }
              inverse
            />

            <SimulationMetric
              label="Cases / judge"
              before={
                simulation.currentCasesPerJudge
              }
              after={
                simulation.projectedCasesPerJudge
              }
              inverse
            />

            <SimulationMetric
              label="Civil pressure"
              before={
                simulation.civilPressure
              }
              after={
                simulation.projectedCivilPressure
              }
              inverse
              decimals={3}
            />

            <SimulationMetric
              label="Criminal pressure"
              before={
                simulation.criminalPressure
              }
              after={
                simulation.projectedCriminalPressure
              }
              inverse
              decimals={3}
            />
          </div>
        </Card>
      )}


      {/* ======================================================
          IMPACT
      ====================================================== */}

      {simulation && (
        <Card>
          <SectionLabel>
            Estimated intervention impact
          </SectionLabel>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 18,
            }}
          >

            <ImpactCard
              label="Backlog reduction"
              value={
                `${simulation.pendingReduction.toFixed(
                  2
                )}%`
              }
              description={`Estimated over ${days} days`}
              positive={
                simulation.pendingReduction > 0
              }
            />

            <ImpactCard
              label="Additional capacity"
              value={
                `${fmt(
                  Math.round(
                    simulation.additionalDailyCapacity
                  )
                )}/day`
              }
              description="Prototype disposal capacity"
              positive
            />

            <ImpactCard
              label="Projected cases / judge"
              value={fmt(
                Math.round(
                  simulation.projectedCasesPerJudge
                )
              )}
              description="After intervention"
              positive={
                simulation.projectedCasesPerJudge <
                simulation.currentCasesPerJudge
              }
            />
          </div>
        </Card>
      )}


      {/* ======================================================
          EXPLANATION
      ====================================================== */}

      {simulation && (() => {
        /*
         * Be honest about the SIZE of the gain, not just its sign.
         * A 0.4% backlog reduction is real but small — telling a
         * judge "measurable gain" for that reads as bigger than it
         * is. Bucket it so the message matches the number.
         */
        const reduction = simulation.pendingReduction;
        const gainInfo =
          reduction >= 5
            ? { label: "Significant backlog reduction", bg: "#E5F0EC", text: T.tealDim, Icon: CheckCircle2, iconColor: T.teal }
            : reduction >= 1
            ? { label: "Modest backlog reduction", bg: "#EFE8D8", text: T.brassDim, Icon: Info, iconColor: T.brassDim }
            : reduction > 0
            ? { label: "Small backlog reduction — consider a larger intervention", bg: T.paperDim, text: T.slate, Icon: Info, iconColor: T.brassDim }
            : { label: "No measurable capacity gain", bg: T.paperDim, text: T.clayDim, Icon: AlertTriangle, iconColor: T.clay };

        return (
        <Card>
          <SectionLabel>
            Decision interpretation
          </SectionLabel>

          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "flex-start",
              padding: 16,
              background: gainInfo.bg,
              borderRadius: 8,
            }}
          >
            <gainInfo.Icon
              size={24}
              color={gainInfo.iconColor}
            />

            <div>
              <div
                style={{
                  ...serif,
                  fontSize: 19,
                  fontWeight: 700,
                  color: gainInfo.text,
                  marginBottom: 5,
                }}
              >
                {gainInfo.label}
              </div>

              <div
                style={{
                  fontSize: 14,
                  color: T.slate,
                  lineHeight: 1.6,
                }}
              >
                Adding{" "}
                <b>
                  {additionalJudges}
                </b>{" "}
                judge
                {additionalJudges !== 1
                  ? "s"
                  : ""}{" "}
                for{" "}
                <b>{days} days</b>{" "}
                is estimated to provide{" "}
                <b>
                  {fmt(
                    Math.round(
                      simulation.additionalDisposed
                    )
                  )}
                </b>{" "}
                additional disposal capacity
                under the prototype assumption.
              </div>
            </div>
          </div>
        </Card>
        );
      })()}


      {/* ======================================================
          METHODOLOGY
      ====================================================== */}

      <Card
        style={{
          background: T.inkSoft,
          borderColor: T.border,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <Calculator
            size={20}
            color={T.brass}
          />

          <div>
            <div
              style={{
                ...serif,
                fontSize: 16,
                fontWeight: 700,
                color: T.paper,
                marginBottom: 6,
              }}
            >
              How the prototype estimates impact
            </div>

            <div
              style={{
                fontSize: 13,
                color: T.slateLight,
                lineHeight: 1.7,
              }}
            >
              The simulator currently uses a transparent
              prototype assumption of{" "}
              <b
                style={{
                  color: T.paper,
                }}
              >
                20 additional case disposals per judge
                per day
              </b>
              . This is an illustrative scenario parameter,
              not an official judicial productivity benchmark.
              The model should be replaced with empirically
              validated disposal-rate data when available.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
/* ============================================================
   ROOT DASHBOARD
============================================================ */

export default function NyayaFlowDashboard() {
  const [districts, setDistricts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  const [refreshing, setRefreshing] =
    useState(false);

  const [tab, setTab] =
    useState("workload");


  /* ----------------------------------------------------------
     FETCH WORKLOAD
  ---------------------------------------------------------- */

  const fetchWorkload = async () => {
    try {
      setError(null);

      const response =
        await fetch(
          `${API_URL}/workload`
        );

      if (!response.ok) {
        throw new Error(
          `API returned ${response.status}`
        );
      }

      const data =
        await response.json();

      console.log(
        "NyayaFlow workload API:",
        data
      );

      const transformed =
        transformWorkloadData(
          data
        );

      setDistricts(transformed);

    } catch (err) {
      console.error(
        "Workload API error:",
        err
      );

      setError(
        err.message ||
          "Failed to connect to FastAPI"
      );

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  /* ----------------------------------------------------------
     INITIAL LOAD
  ---------------------------------------------------------- */

  useEffect(() => {
    fetchWorkload();
  }, []);


  /* ----------------------------------------------------------
     REFRESH
  ---------------------------------------------------------- */

  const handleRefresh = async () => {
    setRefreshing(true);

    try {

      /*
       * First rebuild backend features.
       */
      const refreshResponse =
        await fetch(
          `${API_URL}/refresh`,
          {
            method: "POST",
          }
        );

      if (!refreshResponse.ok) {
        throw new Error(
          `Refresh API returned ${refreshResponse.status}`
        );
      }

      /*
       * Then fetch updated workload.
       */
      await fetchWorkload();

    } catch (err) {
      console.error(
        "Refresh error:",
        err
      );

      setError(
        err.message ||
          "Failed to refresh data"
      );

      setRefreshing(false);
    }
  };


  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div
        style={{
          background: T.ink,

          minHeight: "100vh",

          display: "flex",

          alignItems: "center",

          justifyContent:
            "center",

          color: T.paper,

          ...mono,
        }}
      >
        <div
          style={{
            textAlign: "center",
          }}
        >
          <Activity
            size={34}
            color={T.brass}
            style={{
              marginBottom: 12,
            }}
          />

          <div>
            Loading NyayaFlow...
          </div>

          <div
            style={{
              fontSize: 13,

              color:
                T.slateLight,

              marginTop: 6,
            }}
          >
            Connecting to FastAPI
          </div>
        </div>
      </div>
    );
  }


  /* ==========================================================
     ERROR
  ========================================================== */

  if (error) {
    return (
      <div
        style={{
          background: T.ink,

          minHeight: "100vh",

          display: "flex",

          alignItems: "center",

          justifyContent:
            "center",

          padding: 30,

          color: T.paper,
        }}
      >
        <Card
          style={{
            maxWidth: 500,

            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",

              alignItems: "center",

              gap: 10,

              marginBottom: 12,
            }}
          >
            <AlertTriangle
              color={T.clay}
              size={26}
            />

            <div
              style={{
                ...serif,

                fontSize: 24,

                fontWeight: 700,

                color: T.ink,
              }}
            >
              API Connection Failed
            </div>
          </div>

          <div
            style={{
              fontSize: 15,

              color: T.slate,

              lineHeight: 1.6,
            }}
          >
            {error}
          </div>

          <div
            style={{
              marginTop: 14,

              padding: 12,

              background:
                T.paperDim,

              borderRadius: 8,

              ...mono,

              fontSize: 13,

              color: T.slate,
            }}
          >
            Expected FastAPI:
            <br />

            http://127.0.0.1:8000
          </div>

          <button
            onClick={() => {
              setLoading(true);
              fetchWorkload();
            }}
            style={{
              marginTop: 16,

              padding:
                "9px 16px",

              border: "none",

              borderRadius: 8,

              background:
                T.brass,

              color: T.paper,

              cursor: "pointer",

              fontWeight: 700,
            }}
          >
            Try Again
          </button>
        </Card>
      </div>
    );
  }


  /* ==========================================================
     MAIN UI
  ========================================================== */

  return (
    <div
      style={{
        background: T.ink,

        minHeight: "100vh",

        padding:
          "28px 20px",

        colorScheme: "dark",
      }}
    >
      <div
        style={{
          maxWidth: 1180,

          margin: "0 auto",
        }}
      >

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div
          style={{
            display: "flex",

            alignItems: "center",

            gap: 16,

            marginBottom: 4,
          }}
        >
          <Gavel
            size={26}
            color={T.brass}
          />

          <span
            style={{
              ...serif,

              fontSize: 26,

              fontWeight: 700,

              color: T.paper,
            }}
          >
            NyayaFlow
          </span>

          <span
            style={{
              ...mono,

              fontSize: 12,

              color: T.slateLight,

              marginLeft: 4,
            }}
          >
            JUDICIAL BACKLOG INTELLIGENCE
          </span>
        </div>


        <p
          style={{
            fontSize: 14,

            color: T.slateLight,

            marginBottom: 20,

            maxWidth: 720,

            lineHeight: 1.5,
          }}
        >
          District-level judicial workload
          intelligence powered by the NyayaFlow
          FastAPI backend and workload scoring
          pipeline.
        </p>


        {/* ====================================================
            TOOLBAR / TABS
        ==================================================== */}

        <div
          style={{
            display: "flex",

            justifyContent:
              "space-between",

            alignItems: "center",

            marginBottom: 20,

            paddingBottom: 12,

            borderBottom:
              `1px solid ${T.border}`,

            flexWrap: "wrap",

            gap: 16,
          }}
        >

          {/* TABS */}

          <div
            style={{
              display: "flex",

              alignItems: "center",

              gap: 8,

              flexWrap: "wrap",
            }}
          >

            {/* WORKLOAD */}

            <button
              onClick={() =>
                setTab("workload")
              }
              style={{
                display: "flex",

                alignItems: "center",

                gap: 6,

                border:
                  `1px solid ${T.border}`,

                background:
                  tab === "workload"
                    ? T.brass
                    : "transparent",

                color:
                  tab === "workload"
                    ? T.ink
                    : T.slateLight,

                padding:
                  "11px 18px",

                borderRadius: 8,

                cursor: "pointer",

                fontSize: 13,

                fontWeight: 700,

                ...mono,
              }}
            >
              <Scale size={15} />

              Workload
            </button>


            {/* REALLOCATION */}

            <button
              onClick={() =>
                setTab("reallocation")
              }
              style={{
                display: "flex",

                alignItems: "center",

                gap: 6,

                border:
                  `1px solid ${T.border}`,

                background:
                  tab === "reallocation"
                    ? T.brass
                    : "transparent",

                color:
                  tab === "reallocation"
                    ? T.ink
                    : T.slateLight,

                padding:
                  "11px 18px",

                borderRadius: 8,

                cursor: "pointer",

                fontSize: 13,

                fontWeight: 700,

                ...mono,
              }}
            >
              <TrendingUp size={15} />

              Reallocation
            </button>


            {/* WHAT IF */}

            <button
              onClick={() =>
                setTab("whatif")
              }
              style={{
                display: "flex",

                alignItems: "center",

                gap: 6,

                border:
                  `1px solid ${T.border}`,

                background:
                  tab === "whatif"
                    ? T.brass
                    : "transparent",

                color:
                  tab === "whatif"
                    ? T.ink
                    : T.slateLight,

                padding:
                  "11px 18px",

                borderRadius: 8,

                cursor: "pointer",

                fontSize: 13,

                fontWeight: 700,

                ...mono,
              }}
            >
              <Calculator size={15} />

              What-If
            </button>

          </div>


          {/* REFRESH */}

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              display: "flex",

              alignItems: "center",

              gap: 7,

              padding:
                "11px 18px",

              border:
                `1px solid ${T.border}`,

              borderRadius: 8,

              background:
                "transparent",

              color: T.paper,

              cursor:
                refreshing
                  ? "default"
                  : "pointer",

              opacity:
                refreshing
                  ? 0.6
                  : 1,

              fontSize: 13,

              ...mono,
            }}
          >
            <RefreshCw
              size={15}

              style={{
                transform:
                  refreshing
                    ? "rotate(360deg)"
                    : "none",

                transition:
                  "transform 0.5s",
              }}
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh Data"}
          </button>

        </div>


        {/* ====================================================
            DASHBOARD CONTENT
        ==================================================== */}

        {tab === "workload" && (
          <Overview
            districts={districts}
          />
        )}


        {tab === "reallocation" && (
          <Reallocation />
        )}


        {tab === "whatif" && (
          <WhatIf
            districts={districts}
          />
        )}


        {/* ====================================================
            FOOTER
        ==================================================== */}

        <div
          style={{
            marginTop: 28,

            paddingTop: 16,

            borderTop:
              `1px solid ${T.border}`,

            fontSize: 13,

            color: T.slateLight,

            lineHeight: 1.6,
          }}
        >
          NyayaFlow is a prototype decision-support
          system for judicial workload analysis.
          Workload scores are generated from the
          current dataset and should not be treated
          as official judicial administrative
          recommendations.
        </div>

      </div>
    </div>
  );
}