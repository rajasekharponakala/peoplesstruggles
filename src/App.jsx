import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Footer, Header, Loading } from "./components/Layout";

const Home = lazy(() => import("./pages/Home"));
const Library = lazy(() => import("./pages/Library"));
const Reader = lazy(() => import("./pages/Reader"));
const Timeline = lazy(() => import("./pages/Timeline"));
const Atlas = lazy(() => import("./pages/Atlas"));
const Martyrs = lazy(() => import("./pages/Martyrs"));
const People = lazy(() => import("./pages/People"));
const Witness = lazy(() => import("./pages/Witness"));
const Insights = lazy(() => import("./pages/Insights"));
const Glossary = lazy(() => import("./pages/Glossary"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    if (!/[?&]b=/.test(search)) window.scrollTo(0, 0);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function Shell() {
  const { pathname } = useLocation();
  const full = pathname.startsWith("/map");
  return (
    <div className="shell">
      <a href="#main" className="sr-only">Skip to content</a>
      <Header />
      <main id="main">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/read" element={<Library />} />
            <Route path="/read/:id" element={<Reader />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/map" element={<Atlas />} />
            <Route path="/martyrs" element={<Martyrs />} />
            <Route path="/people" element={<People />} />
            <Route path="/witness" element={<Witness />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/glossary" element={<Glossary />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/names" element={<Navigate to="/search?tab=index" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!full && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <ScrollToTop />
      <Shell />
    </BrowserRouter>
  );
}
