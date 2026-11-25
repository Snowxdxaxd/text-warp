import TextWarp from "./warp/TextWarp.jsx";
import asciiZoomImg from "./assets/ascii-zoom.webp";

const HERO_PHRASES = [
  "ТЕКСТ ИЗГИБАЕТСЯ",
  "ВОКРУГ КУРСОРА",
  "ЖИВЫЕ ИНТЕРФЕЙСЫ",
  "SPRING PHYSICS",
  "БЕЗ КАРТИНОК",
  "ТОЛЬКО МАТЕМАТИКА",
  "REACT CANVAS",
  "ПОПРОБУЙ КЛИКНУТЬ",
];

const BAND_PHRASES = [
  "ПРУЖИНА — ИЗГИБ — ВОЛНА",
  "REACT CANVAS SPRING PHYSICS",
  "БЕЗ БИБЛИОТЕК АНИМАЦИИ",
];

const FEATURES = [
  {
    n: "01",
    title: "Пружины",
    text: "Каждый символ привязан к своей точке пружиной: жёсткость задаёт скорость возврата, затухание — упругий перелёт. Никаких ключевых кадров, только второй закон Ньютона в упрощении.",
  },
  {
    n: "02",
    title: "Отталкивание",
    text: "Курсор в радиусе сдвигает цели символов: сила гасится квадратично с расстоянием, поэтому у курсора текст расходится сильно, а на краях едва дышит.",
  },
  {
    n: "03",
    title: "Ударная волна",
    text: "Клик рождает расходящееся кольцо. Символы на фронте получают импульс от центра клика — по странице пробегает круговая волна.",
  },
  {
    n: "04",
    title: "Наклон",
    text: "Буквы наклоняются пропорционально горизонтальной скорости, поэтому текст не просто разлетается, а перетекает, как тяжёлая ткань.",
  },
];

export default function App() {
  return (
    <div id="top">
      <header className="header">
        <a className="logo" href="#top">
          text<em>—</em>warp
        </a>
        <nav className="nav">
          <a href="#how">как устроено</a>
          <a href="#tune">настройка</a>
          <a href="https://github.com/Snowxdxaxd/text-warp" target="_blank" rel="noreferrer">
            github
          </a>
        </nav>
      </header>

      <div className="hero">
        <TextWarp phrases={HERO_PHRASES} />
        <div className="hint">води курсором — текст упругий · клик — ударная волна</div>
      </div>

      <div className="band" aria-hidden="true">
        <TextWarp phrases={BAND_PHRASES} rows={2} repel={0.4} breathe={2} />
      </div>

      <main>
        <section id="how">
          <div className="secnum">01</div>
          <h2>Как устроено</h2>
          {FEATURES.map((f) => (
            <div className="feature" key={f.n}>
              <div className="n">{f.n}</div>
              <div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            </div>
          ))}
        </section>

        <section id="tune">
          <div className="secnum">02</div>
          <h2>Крутить руками</h2>
          <p className="lead">
            Вся физика живёт в одном файле <code>src/warp/TextWarp.jsx</code>. Константы в
            шапке файла — поменяй значение и сразу увидишь разницу.
          </p>
          <pre className="code">
            <span className="cm">// шапка src/warp/TextWarp.jsx</span>
            {"\n"}
            <span className="kw">const</span> STIFFNESS = <span className="num">0.085</span>
            {"   "}
            <span className="cm">// жёсткость пружины</span>
            {"\n"}
            <span className="kw">const</span> DAMPING = <span className="num">0.84</span>
            {"      "}
            <span className="cm">// затухание</span>
            {"\n"}
            <span className="kw">const</span> REPEL = <span className="num">0.55</span>
            {"       "}
            <span className="cm">// сила отталкивания</span>
            {"\n"}
            <span className="kw">const</span> WAVE_SPEED = <span className="num">1400</span>
            {"  "}
            <span className="cm">// скорость волны, px/с</span>
          </pre>
          <p className="lead">
            Запуск: <code>npm ci</code>, затем <code>npm run dev</code>. Прод-сборка —{" "}
            <code>npm run build</code>.
          </p>
        </section>

        <section id="more">
          <div className="secnum">03</div>
          <h2>Ещё демка</h2>
          <a
            className="card"
            href="https://snowxdxaxd.github.io/ascii-zoom/"
            target="_blank"
            rel="noreferrer"
          >
            <img src={asciiZoomImg} alt="ascii-zoom" />
            <span className="body">
              <span className="tag">ascii — zoom</span>
              <h3>Глаз, который смотрит в зрачок</h3>
              <p>
                Окно из ascii-знакомест: глаз моргает, водит взглядом и улетает в собственный
                зрачок, из которого собирается красная звезда. Тот же принцип — процедурная
                яркость и символы вместо картинок. Есть desktop-версия на Rust.
              </p>
              <span className="go">открыть демо</span>
            </span>
          </a>
        </section>
      </main>

      <footer>
        <span>text—warp · упругая типографика · 2026</span>
        <span>
          <a href="https://github.com/Snowxdxaxd/text-warp">код</a>
          {" · "}
          <a href="https://github.com/Snowxdxaxd">профиль</a>
        </span>
      </footer>
    </div>
  );
}
