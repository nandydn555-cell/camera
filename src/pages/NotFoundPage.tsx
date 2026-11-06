import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return <section className="section empty"><span className="eyebrow">404</span><h1>That frame is out of view.</h1><p>The page may have moved or the link may be incorrect.</p><Link className="button dark-button" to="/">Return home</Link></section>;
}
