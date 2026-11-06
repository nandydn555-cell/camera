import { Link } from 'react-router-dom';
import { Camera } from 'lucide-react';

export default function SiteFooter() {
  return (
    <footer>
      <div className="footer-main">
        <div>
          <Link className="wordmark" to="/"><span className="mark"><Camera size={18} /></span> LENS<span>LINE</span></Link>
          <p>Tools for the moments that matter.</p>
        </div>
        <div><b>Explore</b><Link to="/shop">Shop all gear</Link><Link to="/cameras">Cameras</Link><Link to="/accessories">Accessories</Link></div>
        <div><b>Customer care</b><span>Ulaanbaatar, Mongolia</span><a href="mailto:hello@lensline.mn">hello@lensline.mn</a><span>Mon–Sat · 10:00–19:00</span></div>
        <div><b>Stay in focus</b><p>Thoughtful equipment. Knowledgeable support.</p></div>
      </div>
      <div className="footer-bottom"><span>© 2026 Lensline Camera Store</span><span>Made for seeing more.</span></div>
    </footer>
  );
}
