// Server component shown when the database can't be reached — either
// DATABASE_URL is unset or the tables haven't been created yet. It turns a
// would-be crash into first-run setup instructions in the app's own voice.
export default function SetupNotice({ detail }: { detail?: string }) {
  return (
    <section className="questlog">
      <div className="panel">
        <header className="masthead">
          <div className="wordmark">
            <span className="wordmark__crest" aria-hidden>
              ❖
            </span>
            <span className="wordmark__text">Quest&nbsp;Log</span>
          </div>
        </header>

        <div className="setup">
          <h1 className="setup__title">Prepare your quest log</h1>
          <p className="setup__lead">
            The log needs a database before it can track your quests and XP. Connect Neon
            and you&rsquo;re ready to play.
          </p>

          <ol className="setup__steps">
            <li>
              <span className="setup__n">1</span>
              <div>
                Create a free Postgres database at{" "}
                <a href="https://neon.tech" target="_blank" rel="noreferrer">
                  neon.tech
                </a>{" "}
                and copy its connection string.
              </div>
            </li>
            <li>
              <span className="setup__n">2</span>
              <div>
                Put it in <code>.env.local</code> as{" "}
                <code>DATABASE_URL=&quot;…&quot;</code> (locally), or add it as an environment
                variable in Vercel.
              </div>
            </li>
            <li>
              <span className="setup__n">3</span>
              <div>
                Run <code>npm run db:push</code> to create the tables, then reload this page.
              </div>
            </li>
          </ol>

          {detail && <p className="setup__detail">{detail}</p>}
        </div>
      </div>
      <p className="footnote">Complete quests · earn XP · level up · keep the streak alive</p>
    </section>
  );
}
