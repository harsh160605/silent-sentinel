import React, { useState, useEffect } from 'react';
import { Shield, MapPin, AlertCircle, Users, Lock, Zap, ArrowRight, Check, Activity, Globe, Heart, Mic, Star, Clock } from 'lucide-react';
import '../styles/Homepage.css';

// Using the original logo
import logo from '../assets/logo.png';
import geminiVisual from '../assets/Gemini-2.0-Flash-for-mobile.png';

function Homepage({ onGetStarted }) {
    const [scrolled, setScrolled] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        // Ensure body is scrollable on homepage
        document.body.style.overflowY = 'auto';
        document.body.style.overflowX = 'hidden';

        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        const handleMouseMove = (e) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('mousemove', handleMouseMove);

        // Intersection Observer for Reveal Animations
        const observerOptions = {
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal-active');
                }
            });
        }, observerOptions);

        const revealElements = document.querySelectorAll('.reveal');
        revealElements.forEach(el => observer.observe(el));

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('mousemove', handleMouseMove);
            revealElements.forEach(el => observer.unobserve(el));
            // Restore dashbord-ready overflow if navigating away
            document.body.style.overflow = '';
        };
    }, []);

    const features = [
        {
            icon: MapPin,
            title: 'Dynamic Map Layers',
            description: 'Intelligent multi-layer mapping showing safety perceptions, verified incidents, and AI-detected patterns.'
        },
        {
            icon: Shield,
            title: 'Gemini AI Analysis',
            description: 'Advanced NLP that extracts risk levels and categories from natural language reports in real-time.'
        },
        {
            icon: Mic,
            title: 'Voice-Enabled Input',
            description: 'Seamless hands-free reporting using integrated voice transcription for rapid incident alerts.'
        },
        {
            icon: Star,
            title: 'Safety Infrastructure Rating',
            description: 'Rate areas based on lighting, foot traffic, and security presence to help build a safer community.'
        },
        {
            icon: Users,
            title: 'Community Groups',
            description: 'Join neighborhood-focused hubs to coordinate, verify reports, and share local safety updates.'
        },
        {
            icon: Zap,
            title: 'Proximity Defense',
            description: 'Receive real-time notifications as you enter or approach high-risk zones detected by community intelligence.'
        }
    ];

    const trustMetrics = [
        { label: 'Active Reports', value: '0k+', icon: Activity },
        { label: 'Communities Protected', value: '0+', icon: Globe },
        { label: 'Safety Index', value: '0%', icon: Heart }
    ];

    return (
        <div className="homepage">
            {/* Navigation */}
            <nav className={`homepage-nav ${scrolled ? 'scrolled' : ''}`}>
                <div className="nav-container">
                    <div className="nav-logo">
                        <img src={logo} alt="Silent Sentinel Logo" className="logo-img" />
                        <span>SILENT SENTINEL</span>
                    </div>
                    <div className="nav-links">
                        <button className="nav-cta-button" onClick={onGetStarted}>
                            Enter Dashboard
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section reveal">
                <div
                    className="hero-glow-follow"
                    style={{
                        left: `${mousePos.x}px`,
                        top: `${mousePos.y}px`
                    }}
                ></div>
                <div className="hero-content reveal">
                    <div className="hero-badge reveal">
                        <span>ESTABLISHING SECURE CONNECTION</span>
                    </div>
                    <h1 className="hero-title reveal">
                        <span>Safety Intelligence.</span>
                        <span className="text-gradient">Redefined for Privacy.</span>
                    </h1>
                    <p className="hero-subtitle reveal">
                        The ultimate high-fidelity safety intelligence protocol. Silent Sentinel transforms community vigilance
                        into actionable insights while maintaining absolute digital sovereignty.
                    </p>
                    <div className="hero-buttons reveal">
                        <button className="btn-premium-primary" onClick={onGetStarted}>
                            <span>INITIALISE SYSTEM</span>
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </section>

            {/* Safety Protocol Ticker */}
            <section className="protocol-ticker-section">
                <div className="ticker-wrapper">
                    <div className="ticker-content">
                        <span>• ANONYMOUS REPORTING ACTIVE</span>
                        <span>• NEURAL TRIAGE ONLINE</span>
                        <span>• COMMUNITY VERIFICATION LAYER 1 ENABLED</span>
                        <span>• ZERO DATA LOGGING POLICY VERIFIED</span>
                        <span>• GEOSPATIAL ENCRYPTION ACTIVE</span>
                    </div>
                </div>
            </section>

            {/* Trust Metrics */}
            <section className="metrics-section reveal">
                <div className="metrics-container">
                    {trustMetrics.map((metric, i) => (
                        <div key={i} className="metric-card">
                            <metric.icon size={20} className="metric-icon" />
                            <div className="metric-group">
                                <span className="metric-value">{metric.value}</span>
                                <span className="metric-label">{metric.label}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Grid */}
            <section className="features-section">
                <div className="section-header">
                    <h2 className="section-title">Security Layers</h2>
                    <p className="section-desc">Sophisticated technology meets human-centric design for total protection.</p>
                </div>
                <div className="features-grid">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div key={index} className="feature-card reveal" style={{ transitionDelay: `${index * 0.1}s` }}>
                                <div className="feature-icon-wrapper">
                                    <Icon size={24} />
                                </div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* How It Works Section */}
            <section className="process-section reveal">
                <div className="section-header">
                    <span className="section-badge">CORE FLOW</span>
                    <h2 className="section-title">Verified Intelligence</h2>
                    <p className="section-desc">A professional workflow designed for speed, accuracy, and absolute privacy.</p>
                </div>
                <div className="process-grid">
                    <div className="process-step">
                        <div className="step-number">01</div>
                        <h4>Describe & Locate</h4>
                        <p>Submit a report via text or voice. Our system captures precise coordinates without linking them to your identity.</p>
                    </div>
                    <div className="process-step">
                        <div className="step-number">02</div>
                        <h4>Gemini AI Triage</h4>
                        <p>Google Gemini analyzes your report to extract risk levels (High/Medium/Low) and filter prohibited content instantly.</p>
                    </div>
                    <div className="process-step">
                        <div className="step-number">03</div>
                        <h4>Community Shield</h4>
                        <p>Validated data appears on the live map and feed. Proximity alerts notify nearby users of potential hazards.</p>
                    </div>
                </div>
            </section>

            {/* AI Intelligence Deep-Dive */}
            <section className="ai-deep-dive reveal">
                <div className="ai-container">
                    <div className="ai-visual">
                        <div className="gemini-visual-container">
                            <img src={geminiVisual} alt="Gemini 2.0 Flash" className="gemini-logo-visual" />
                        </div>
                    </div>
                    <div className="ai-text">
                        <span className="focus-badge">POWERED BY GEMINI 2.0</span>
                        <h2>Neural <span className="text-gradient">Risk Detection</span></h2>
                        <p>Silent Sentinel uses Google’s Gemini 2.0 Flash to understand human context. It doesn't just look for keywords—it understands intent, detects safety infrastructure gaps, and automates community moderation to prevent bias and doxxing.</p>
                        <div className="ai-stats">
                            <div className="ai-stat-item">
                                <span className="stat-num">~0.4s</span>
                                <span className="stat-txt">Gemini Triage Speed</span>
                            </div>
                            <div className="ai-stat-item">
                                <span className="stat-num">99.99%</span>
                                <span className="stat-txt">Moderated Content</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Focus Section - Minimalist */}
            <section className="focus-section reveal">
                <div className="focus-container">
                    <div className="focus-content reveal">
                        <span className="focus-badge">EPHEMERAL INTELLIGENCE</span>
                        <h2>Dynamic Insights, <span className="text-gradient">Zero Persistence</span></h2>
                        <p>Unlike traditional surveillance, Silent Sentinel is built on ephemeral data. Every report is automatically purged from the system after 30 days, ensuring the map remains a reflection of current safety, not a permanent archive of fear.</p>
                        <div className="tech-specs">
                            <div className="spec-item">
                                <Clock size={16} />
                                <span>30-Day Auto-Expiry Protocol</span>
                            </div>
                            <div className="spec-item">
                                <Shield size={16} />
                                <span>No Profile or Account Required</span>
                            </div>
                            <div className="spec-item">
                                <Lock size={16} />
                                <span>Identity-Masked Coordinate Layer</span>
                            </div>
                        </div>
                    </div>
                    <div className="focus-visual reveal">
                        <div className="dynamic-protocol-display">
                            <div className="data-circles">
                                <div className="c-orbit co1"></div>
                                <div className="c-orbit co2"></div>
                                <div className="c-center">
                                    <Shield size={64} className="shield-glow-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Community Pulse Section */}
            <section className="pulse-section reveal">
                <div className="pulse-container">
                    <div className="pulse-header">
                        <h2>Community <span className="text-gradient">Momentum</span></h2>
                        <p>Real-time metrics from the global Sentinel network.</p>
                    </div>
                    <div className="pulse-grid">
                        <div className="pulse-card">
                            <div className="p-icon"><Globe size={32} /></div>
                            <div className="p-val">0+</div>
                            <div className="p-lab">Active Nodes</div>
                        </div>
                        <div className="pulse-card highlight">
                            <div className="p-icon"><Zap size={32} /></div>
                            <div className="p-val">0.2s</div>
                            <div className="p-lab">Avg Triage Speed</div>
                        </div>
                        <div className="pulse-card">
                            <div className="p-icon"><Users size={32} /></div>
                            <div className="p-val">0+</div>
                            <div className="p-lab">Community Guards</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Philosophy */}
            <section className="philosophy-section reveal">
                <div className="philosophy-container">
                    <div className="section-header">
                        <h2 className="section-title">The Protocol Philosophy</h2>
                    </div>
                    <div className="philosophy-grid">
                        <div className="philosophy-panel reveal">
                            <h3>PROHIBITED</h3>
                            <ul>
                                <li>Persistent geographic history storage</li>
                                <li>State-level surveillance integration</li>
                                <li>Vigilantism or calls for violence</li>
                                <li>Monetization of community data</li>
                            </ul>
                        </div>
                        <div className="philosophy-panel active reveal">
                            <h3>MANDATED</h3>
                            <ul>
                                <li>30-Day Automatic Data Purge</li>
                                <li>Absolute User Identity Sovereignty</li>
                                <li>AI-Powered Ethical Moderation</li>
                                <li>Neighborhood-Centric Governance</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section reveal">
                <div className="cta-content">
                    <h2>Ready to contribute?</h2>
                    <p>Join the global network of citizen guardians today.</p>
                    <button className="btn-premium-primary" onClick={onGetStarted}>
                        <span>Enter the Network</span>
                        <ArrowRight size={18} />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="homepage-footer">
                <div className="footer-container">
                    <div className="footer-top">
                        <div className="footer-brand">
                            <img src={logo} alt="Logo" className="footer-logo" />
                            <p>Global standard for privacy-first community safety intelligence.</p>
                        </div>
                        <div className="footer-links-grid">
                            <div className="link-col">
                                <h6>Platform</h6>
                                <a href="#">Guardian Map</a>
                                <a href="#">Transparency</a>
                            </div>
                            <div className="link-col">
                                <h6>Support</h6>
                                <a href="https://github.com/harsh160605/silent-sentinel">Documentation</a>
                                <a href="#">Status</a>
                            </div>
                            <div className="link-col">
                                <h6>Legal</h6>
                                <a href="#">Privacy</a>
                                <a href="#">Terms</a>
                            </div>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; 2026 SILENT SENTINEL PROTOCOL. VERIFIED SECURE.</p>
                        <p className="footer-credit">Built by Team Pegasus.exe</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Homepage;
