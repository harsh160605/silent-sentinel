import React, { useState } from 'react';
import { Shield, MapPin, AlertCircle, Users, Lock, Zap, ArrowRight, Check } from 'lucide-react';
import '../styles/Homepage.css';

function Homepage({ onGetStarted }) {
    const [hoveredFeature, setHoveredFeature] = useState(null);

    const features = [
        {
            icon: MapPin,
            title: 'Interactive Safety Map',
            description: 'Real-time visualization of community safety with multi-layer reporting system'
        },
        {
            icon: AlertCircle,
            title: 'Smart Report Parsing',
            description: 'Describe incidents in your own words - AI extracts risk levels and categories'
        },
        {
            icon: Lock,
            title: 'Privacy-First Design',
            description: 'Anonymous but accountable - your location is never stored permanently'
        },
        {
            icon: Users,
            title: 'Community Intelligence',
            description: 'Verify incidents with multiple reports and identify emerging patterns'
        },
        {
            icon: Zap,
            title: 'Smart Notifications',
            description: 'Proximity alerts when entering higher-risk zones - calm and informative'
        },
        {
            icon: Shield,
            title: 'AI Moderation',
            description: 'Ethical guardrails prevent hate speech, doxxing, and vigilantism'
        }
    ];

    const benefits = [
        'No personal data collected',
        'Auto-expiring safety reports',
        'Anonymous authentication',
        'Multi-language support',
        'Open-source & auditable',
        'Community-driven'
    ];

    return (
        <div className="homepage">
            {/* Navigation */}
            <nav className="homepage-nav">
                <div className="nav-container">
                    <div className="nav-logo">
                        <Shield size={28} />
                        <span>Silent Sentinel</span>
                    </div>
                    <button className="nav-cta-button" onClick={onGetStarted}>
                        Get Started
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-badge">🛡️ Privacy-First Safety Platform</div>
                    <h1 className="hero-title">Your Community's Safety, Without the Surveillance</h1>
                    <p className="hero-subtitle">
                        Silent Sentinel is a hyper-local safety platform that puts privacy first. Report incidents anonymously,
                        discover community patterns, and stay informed—all without tracking anyone.
                    </p>
                    <div className="hero-buttons">
                        <button className="btn btn-primary btn-lg" onClick={onGetStarted}>
                            <span>Explore the Map</span>
                            <ArrowRight size={20} />
                        </button>
                        <button className="btn btn-secondary btn-lg">
                            Learn More
                        </button>
                    </div>
                    <p className="hero-disclaimer">
                        ✨ No login required • Fully anonymous • Zero tracking
                    </p>
                </div>
            </section>

            {/* Features Grid */}
            <section className="features-section">
                <div className="section-header">
                    <h2>Powerful Features</h2>
                    <p>Everything you need for community safety awareness</p>
                </div>
                <div className="features-grid">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={index}
                                className="feature-card"
                                onMouseEnter={() => setHoveredFeature(index)}
                                onMouseLeave={() => setHoveredFeature(null)}
                            >
                                <div className={`feature-icon ${hoveredFeature === index ? 'active' : ''}`}>
                                    <Icon size={32} />
                                </div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* How It Works */}
            <section className="how-it-works">
                <div className="section-header">
                    <h2>How It Works</h2>
                    <p>Simple, transparent, privacy-respecting</p>
                </div>
                <div className="steps-container">
                    <div className="step">
                        <div className="step-number">1</div>
                        <h3>Browse the Map</h3>
                        <p>View community reports, patterns, and safety zones in real-time</p>
                    </div>
                    <div className="step-divider"></div>
                    <div className="step">
                        <div className="step-number">2</div>
                        <h3>Report Anonymously</h3>
                        <p>Describe incidents in your own words - no rigid forms</p>
                    </div>
                    <div className="step-divider"></div>
                    <div className="step">
                        <div className="step-number">3</div>
                        <h3>AI Analysis</h3>
                        <p>Smart categorization and risk assessment happens automatically</p>
                    </div>
                    <div className="step-divider"></div>
                    <div className="step">
                        <div className="step-number">4</div>
                        <h3>Community Insights</h3>
                        <p>See patterns emerge as more people share their experiences</p>
                    </div>
                </div>
            </section>

            {/* Why Section */}
            <section className="why-section">
                <div className="why-content">
                    <h2>Why Silent Sentinel?</h2>
                    <div className="benefits-grid">
                        {benefits.map((benefit, index) => (
                            <div key={index} className="benefit-item">
                                <Check size={20} className="benefit-icon" />
                                <span>{benefit}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="why-visual">
                    <div className="safety-illustration">
                        <MapPin size={120} className="illustration-icon" />
                    </div>
                </div>
            </section>

            {/* Core Philosophy */}
            <section className="philosophy-section">
                <div className="section-header">
                    <h2>Our Philosophy</h2>
                </div>
                <div className="philosophy-grid">
                    <div className="philosophy-card is-not">
                        <h3>❌ We Are NOT</h3>
                        <ul>
                            <li>A crime-tracking app</li>
                            <li>A surveillance tool</li>
                            <li>A vigilante enabler</li>
                            <li>A fear-mongering platform</li>
                            <li>Collecting permanent data</li>
                        </ul>
                    </div>
                    <div className="philosophy-card is">
                        <h3>✅ We ARE</h3>
                        <ul>
                            <li>Privacy-first & consent-based</li>
                            <li>Anonymous but accountable</li>
                            <li>Community-driven intelligence</li>
                            <li>Ethically designed from the ground up</li>
                            <li>Transparent & auditable</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-content">
                    <h2>Ready to Make Your Community Safer?</h2>
                    <p>No sign-up needed. No data collection. Just pure, community-driven safety intelligence.</p>
                    <button className="btn btn-primary btn-lg" onClick={onGetStarted}>
                        <span>Start Exploring</span>
                        <ArrowRight size={20} />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="homepage-footer">
                <div className="footer-content">
                    <div className="footer-section">
                        <h4>Silent Sentinel</h4>
                        <p>Privacy-first community safety platform</p>
                    </div>
                    <div className="footer-section">
                        <h4>Resources</h4>
                        <ul>
                            <li><a href="#">Documentation</a></li>
                            <li><a href="#">GitHub</a></li>
                            <li><a href="#">License</a></li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h4>Community</h4>
                        <ul>
                            <li><a href="#">Report Issues</a></li>
                            <li><a href="#">Contribute</a></li>
                            <li><a href="#">Feedback</a></li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2025 Silent Sentinel. Privacy-first community safety. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

export default Homepage;
