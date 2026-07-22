import React, { useState, useEffect } from "react";
import { ChefHat, ArrowRight } from "lucide-react";

interface HeroProps {
  onExploreClick: () => void;
  backendUrl: string;
}

const HERO_IMAGES = [
  "/images/owner_sushi_platter.jpg",
  "/images/chef_muami.jpg",
  "/images/owner_dumplings.jpg",
  "/images/gallery_dim_sum_steam.png",
  "/images/dragon_roll.png",
  "/images/salmon_nigiri.png"
];

const Hero: React.FC<HeroProps> = ({ onExploreClick, backendUrl }) => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000); // Switches slide every 5 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <header
      id="home"
      style={{
        position: "relative",
        minHeight: "90vh",
        display: "flex",
        alignItems: "center",
        paddingTop: "80px",
        overflow: "hidden",
        // backgroundColor: "#00000004",
      }}
    >
      {/* 1. Background Slider Container */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          overflow: "hidden",
        }}
      >
        {HERO_IMAGES.map((imgUrl, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: `url("${backendUrl}${imgUrl}") no-repeat center center/cover`,
              opacity: activeSlide === index ? 1 : 0,
              transform: activeSlide === index ? "scale(1.04)" : "scale(1)",
              transition: "opacity 1.5s ease-in-out, transform 5s ease-in-out",
              pointerEvents: "none",
              zIndex: activeSlide === index ? 10 : 1,
            }}
          />
        ))}
      </div>

      {/* 3. Slider Dot Indicators */}
      <div
        style={{
          position: "absolute",
          bottom: "32px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "12px",
          zIndex: 15,
        }}
      >
        {HERO_IMAGES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveSlide(idx)}
            style={{
              width: activeSlide === idx ? "24px" : "8px",
              height: "8px",
              borderRadius: "var(--radius-full)",
              backgroundColor:
                activeSlide === idx
                  ? "var(--color-gold)"
                  : "rgba(255, 255, 255, 0.3)",
              transition: "var(--transition-smooth)",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
            title={`Slide ${idx + 1}`}
          />
        ))}
      </div>


      {/* 4. Text Content Card */}
      <div className="container" style={{ position: "relative", zIndex: 10 }}>
        <div style={{ maxWidth: "680px" }} className="animate-fade">
          {/* Subtle Tagline */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--color-gold-light)",
              color: "var(--color-gold)",
              padding: "6px 16px",
              borderRadius: "var(--radius-full)",
              fontSize: "0.8rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "24px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <ChefHat size={14} />
            Golden Dragon Gastronomy
          </div>

          {/* Main Title */}
          <h1
            style={{
              fontSize: "calc(2.5rem + 1.8vw)",
              lineHeight: 1.15,
              marginBottom: "20px",
              fontFamily: "var(--font-serif)",
              textShadow: "0 2px 15px rgba(0, 0, 0, 0.95), 0 1px 4px rgba(0, 0, 0, 0.95)",
            }}
          >
            The Art of <span className="gold-text" style={{ textShadow: "none" }}>Sushi</span> & <br />
            Steamed <span className="gold-text" style={{ textShadow: "none" }}>Dim Sum</span>
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: "1.1rem",
              color: "#ffffff",
              marginBottom: "36px",
              fontWeight: 400,
              lineHeight: 1.7,
              maxWidth: "560px",
              textShadow: "0 2px 12px rgba(0, 0, 0, 0.95), 0 1px 3px rgba(0, 0, 0, 0.95)",
            }}
          >
            Welcome to Golden Dragon. Experience the culinary harmony of
            authentic Japanese sashimi and traditional steamed Cantonese
            delicacies. Meticulously handcrafted by our master chefs and
            delivered instantly to your door upon command.
          </p>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <button
              onClick={onExploreClick}
              className="btn btn-primary animate-pulse-gold"
            >
              Order for Delivery
              <ArrowRight size={18} />
            </button>
            <button onClick={onExploreClick} className="btn btn-secondary">
              View Menu
            </button>
          </div>

          {/* Culinary Quality Indicators (placed below the buttons) */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              marginTop: "40px",
              flexWrap: "wrap",
            }}
          >
            {[
              { number: "100%", label: "Fresh Ingredients" },
              { number: "45m", label: "Guaranteed Delivery" },
              { number: "4.9★", label: "Client Rating" },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="glass-panel"
                style={{
                  padding: "12px 18px",
                  borderRadius: "var(--radius-md)",
                  textAlign: "center",
                  minWidth: "120px",
                  flexGrow: 1,
                  maxWidth: "180px",
                  animation: `fadeIn 0.6s ease-out ${idx * 0.15}s forwards`,
                }}
              >
                <h3
                  className="gold-text"
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    marginBottom: "2px",
                  }}
                >
                  {stat.number}
                </h3>
                <p
                  style={{
                    fontSize: "0.65rem",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    letterSpacing: "0.05em",
                  }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Hero;
