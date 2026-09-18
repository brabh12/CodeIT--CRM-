import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Sparkles, 
  CheckCircle2, 
  Copy, 
  Check, 
  Clock, 
  ShieldCheck, 
  Zap, 
  Layers, 
  Video, 
  Cloud, 
  Cpu, 
  ArrowDown,
  CreditCard
} from 'lucide-react';
import { submitPublicLead } from '../lib/crmData';
import './CapCutLanding.css';

// =========================================================
// PAYMENT INFORMATION & CUSTOMIZABLE VALUES
// =========================================================
const PLACEHOLDERS = {
  // Payment Details
  ACCOUNT_HOLDER_NAME: 'M. BOUCHEMAT RABAH',
  CCP_NUMBER: '0041293345',
  CCP_KEY: '35',
  BARIDIMOB_NUMBER: '00799999004129334535',

  // Activation Time Window (Honest & Conservative)
  ACTIVATION_TIME: 'في أسرع وقت'
};

export default function CapCutLandingPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    paymentMethod: 'baridimob',
    notes: '',
    // Honeypot field (must stay empty to block bots)
    website_url_hp: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  // Copy to clipboard helper
  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Form validation (Algerian mobile + valid email)
  const validateForm = () => {
    const errs = {};

    if (!formData.fullName.trim()) {
      errs.fullName = 'يرجى إدخال الاسم واللقب';
    }

    const cleanedPhone = formData.phone.replace(/[\s-]/g, '');
    const algerianPhoneRegex = /^(05|06|07)[0-9]{8}$/;
    if (!formData.phone.trim()) {
      errs.phone = 'يرجى إدخال رقم الهاتف';
    } else if (!algerianPhoneRegex.test(cleanedPhone)) {
      errs.phone = 'يرجى إدخال رقم هاتف جزائري صحيح (مثال: 0550123456)';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errs.email = 'يرجى إدخال البريد الإلكتروني لاستلام الحساب';
    } else if (!emailRegex.test(formData.email)) {
      errs.email = 'يرجى إدخال بريد إلكتروني صالح';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Anti-spam honeypot verification
    if (formData.website_url_hp && formData.website_url_hp.trim() !== '') {
      console.warn('Bot submission blocked via honeypot.');
      setIsSuccess(true);
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // 2. Insert into Supabase leads table
      const payload = {
        service: 'capcut',
        full_name: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        payment_method: formData.paymentMethod,
        notes: formData.notes.trim() || null,
        status: 'pending'
      };

      await submitPublicLead(payload);
      setIsSuccess(true);
    } catch (err) {
      console.error('Error submitting order:', err);
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToForm = () => {
    const el = document.getElementById('order-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="capcut-notion-page" dir="rtl">
      <div className="capcut-notion-container">
        
        {/* Top Header / Brand Bar */}
        <header className="capcut-notion-header">
          <div className="capcut-notion-brand">
            <div className="capcut-notion-brand-badge">
              C
            </div>
            <div>
              <div className="capcut-notion-brand-name">CapCut Pro</div>
              <div className="capcut-notion-brand-sub">موزع موثوق عبر CodeIt </div>
            </div>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--crm-text-secondary)' }}>
            طلب فوري وآمن
          </span>
        </header>

        {/* Hero Section */}
        <section className="capcut-notion-hero">
          <div className="capcut-notion-pill">
            <Sparkles size={13} />
            <span>عرض خاص في الجزائر</span>
          </div>

          <h1 className="capcut-notion-title">
            اشترك في CapCut Pro وخدم فيديوهات احترافية بدون حدود
          </h1>

          <p className="capcut-notion-desc">
            وصول كامل لجميع ميزات كاب كات برو للأندرويد، الآيفون، والكمبيوتر — مؤثرات حصرية، أدوات الذكاء الاصطناعي، وبدون أي علامة مائية.
          </p>

          {/* Pricing Card */}
          <div className="capcut-notion-price-card">
            <div>
              <div className="capcut-notion-price-label">سعر الاشتراك الشهري</div>
              <div className="capcut-notion-price-figure">
                <span className="capcut-notion-price-num">600</span>
                <span className="capcut-notion-price-cur">دج</span>
                <span className="capcut-notion-price-sub">/ شهرياً</span>
              </div>
            </div>

            <button type="button" onClick={scrollToForm} className="capcut-notion-cta-btn">
              <span>اطلب الآن (600 دج)</span>
              <ArrowDown size={15} />
            </button>
          </div>

          {/* Trust Tags */}
          <div className="capcut-notion-trust-row">
            <div className="capcut-notion-trust-item">
              <ShieldCheck size={14} color="var(--crm-accent)" />
              <span>حساب شخصي ومضمون</span>
            </div>
            <div className="capcut-notion-trust-item">
              <Clock size={14} color="var(--crm-accent)" />
              <span>تفعيل {PLACEHOLDERS.ACTIVATION_TIME}</span>
            </div>
            <div className="capcut-notion-trust-item">
              <CreditCard size={14} color="var(--crm-accent)" />
              <span>دفع عبر بريدي موب أو CCP</span>
            </div>
          </div>
        </section>

        {/* What's Included Section */}
        <section className="capcut-notion-section">
          <h2 className="capcut-notion-section-title">واش رايح تستفاد مع CapCut Pro؟</h2>
          <p className="capcut-notion-section-sub">جميع الخصائص المدفوعة مفتوحة بين يديك لمونتاج سريع وخفيف</p>

          <div className="capcut-notion-grid">
            <div className="capcut-notion-card">
              <div className="capcut-notion-icon-box">
                <Video size={16} />
              </div>
              <div>
                <div className="capcut-notion-card-title">بدون علامة مائية (No Watermark)</div>
                <div className="capcut-notion-card-desc">تصدير جميع فيديوهاتك بدون شعار كاب كات وبأعلى نقاوة.</div>
              </div>
            </div>

            <div className="capcut-notion-card">
              <div className="capcut-notion-icon-box">
                <Sparkles size={16} />
              </div>
              <div>
                <div className="capcut-notion-card-title">جميع المؤثرات والانتقالات Pro</div>
                <div className="capcut-notion-card-desc">فتح جميع الفلاتر، الانتقالات السلسة، والخطوط المدفوعة.</div>
              </div>
            </div>

            <div className="capcut-notion-card">
              <div className="capcut-notion-icon-box">
                <Cpu size={16} />
              </div>
              <div>
                <div className="capcut-notion-card-title">أدوات الذكاء الاصطناعي (AI Tools)</div>
                <div className="capcut-notion-card-desc">توليد التسميات التلقائية (Auto-Captions) وإزالة الخلفية بضغطة زر.</div>
              </div>
            </div>

            <div className="capcut-notion-card">
              <div className="capcut-notion-icon-box">
                <Layers size={16} />
              </div>
              <div>
                <div className="capcut-notion-card-title">تصدير 4K و 60 FPS</div>
                <div className="capcut-notion-card-desc">رندر سريع بأعلى جودة لمقاطع التيك توك والريلز.</div>
              </div>
            </div>

            <div className="capcut-notion-card">
              <div className="capcut-notion-icon-box">
                <Cloud size={16} />
              </div>
              <div>
                <div className="capcut-notion-card-title">مساحة تخزين سحابية (Cloud)</div>
                <div className="capcut-notion-card-desc">مزامنة مشاريعك بسهولة بين هاتفك والكمبيوتر.</div>
              </div>
            </div>

            <div className="capcut-notion-card">
              <div className="capcut-notion-icon-box">
                <ShieldCheck size={16} />
              </div>
              <div>
                <div className="capcut-notion-card-title">ضمان ودعم طيلة الشهر</div>
                <div className="capcut-notion-card-desc">فريق CodeIt معك لأي استفسار أو مساعدة طيلة فترة اشتراكك.</div>
              </div>
            </div>
          </div>
        </section>

        {/* Payment Instructions Section */}
        <section className="capcut-notion-section">
          <h2 className="capcut-notion-section-title">طريقة الدفع والتفعيل</h2>
          <p className="capcut-notion-section-sub">خطوات واضحة وسريعة للحصول على حسابك</p>

          <div className="capcut-notion-callout">
            <div className="capcut-notion-callout-header">
              <CreditCard size={16} color="var(--crm-accent)" />
              <span>معلومات الحساب البريدي للدفع (600 دج)</span>
            </div>
            <p className="capcut-notion-callout-body">
              قم بتحويل 600 دج عبر بريدي موب أو مركز البريد (CCP)، واحتفظ بوصل التحويل، ثم املأ معلوماتك أدناه لنقوم بتفعيل حسابك {PLACEHOLDERS.ACTIVATION_TIME}.
            </p>

            <div className="capcut-notion-methods">
              {/* Baridimob Box */}
              <div className="capcut-notion-method-box">
                <div className="capcut-notion-method-title">📱 بريدي موب (Baridimob - RIP)</div>
                <div className="capcut-notion-method-val">
                  {PLACEHOLDERS.BARIDIMOB_NUMBER}
                </div>
                <button 
                  type="button" 
                  onClick={() => handleCopy(PLACEHOLDERS.BARIDIMOB_NUMBER, 'baridimob')}
                  className={`capcut-notion-copy-btn ${copiedKey === 'baridimob' ? 'copied' : ''}`}
                >
                  {copiedKey === 'baridimob' ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedKey === 'baridimob' ? 'تم نسخ الرقم!' : 'نسخ رقم RIP'}</span>
                </button>
              </div>

              {/* CCP Box */}
              <div className="capcut-notion-method-box">
                <div className="capcut-notion-method-title">🏦 بريد الجزائر (CCP)</div>
                <div className="capcut-notion-method-val">
                  {PLACEHOLDERS.CCP_NUMBER} — Clé: {PLACEHOLDERS.CCP_KEY}
                </div>
                <button 
                  type="button" 
                  onClick={() => handleCopy(`${PLACEHOLDERS.CCP_NUMBER} ${PLACEHOLDERS.CCP_KEY}`, 'ccp')}
                  className={`capcut-notion-copy-btn ${copiedKey === 'ccp' ? 'copied' : ''}`}
                >
                  {copiedKey === 'ccp' ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedKey === 'ccp' ? 'تم نسخ الحساب!' : 'نسخ رقم CCP'}</span>
                </button>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--crm-text-secondary)', textAlign: 'center', marginTop: '12px' }}>
              اسم صاحب الحساب: <strong>{PLACEHOLDERS.ACCOUNT_HOLDER_NAME}</strong>
            </div>
          </div>
        </section>

        {/* Order Form Section */}
        <section className="capcut-notion-form" id="order-form">
          <h2 className="capcut-notion-section-title">استمارة طلب CapCut Pro</h2>
          <p className="capcut-notion-section-sub">املأ معلوماتك لنقوم بتجهيز حسابك وإرسال تفاصيل الدخول</p>

          {!isSuccess ? (
            <form onSubmit={handleSubmit}>
              
              {/* Anti-spam honeypot field (hidden from real users) */}
              <div style={{ display: 'none', position: 'absolute', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
                <input
                  type="text"
                  name="website_url_hp"
                  tabIndex="-1"
                  autoComplete="off"
                  value={formData.website_url_hp}
                  onChange={(e) => setFormData({ ...formData, website_url_hp: e.target.value })}
                />
              </div>

              <div className="capcut-notion-group">
                <label className="capcut-notion-label">
                  <span className="req">*</span> الاسم واللقب
                </label>
                <input
                  type="text"
                  className={`capcut-notion-input ${errors.fullName ? 'error' : ''}`}
                  placeholder="مثال: كريم بن علي"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
                {errors.fullName && <div className="capcut-notion-error">{errors.fullName}</div>}
              </div>

              <div className="capcut-notion-group">
                <label className="capcut-notion-label">
                  <span className="req">*</span> رقم الهاتف (للتواصل وتأكيد الطلب)
                </label>
                <input
                  type="tel"
                  className={`capcut-notion-input ${errors.phone ? 'error' : ''}`}
                  placeholder="05XX XX XX XX / 06XX / 07XX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                {errors.phone && <div className="capcut-notion-error">{errors.phone}</div>}
              </div>

              <div className="capcut-notion-group">
                <label className="capcut-notion-label">
                  <span className="req">*</span> البريد الإلكتروني (لاستلام بيانات الحساب)
                </label>
                <input
                  type="email"
                  className={`capcut-notion-input ${errors.email ? 'error' : ''}`}
                  placeholder="example@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {errors.email && <div className="capcut-notion-error">{errors.email}</div>}
              </div>

              <div className="capcut-notion-group">
                <label className="capcut-notion-label">
                  طريقة الدفع المستعملة
                </label>
                <select
                  className="capcut-notion-select"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                >
                  <option value="baridimob">بريدي موب (Baridimob)</option>
                  <option value="ccp">حوالة بريدية (CCP)</option>
                  <option value="other">أخرى / استفسار قبل الدفع</option>
                </select>
              </div>

              <div className="capcut-notion-group">
                <label className="capcut-notion-label">
                  ملاحظات أو رقم عملية التحويل (اختياري)
                </label>
                <textarea
                  className="capcut-notion-textarea"
                  placeholder="أدخل أي ملاحظة إضافية أو رقم وصل الدفع..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <button 
                type="submit" 
                className="capcut-notion-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>جاري تأكيد الطلب...</span>
                ) : (
                  <>
                    <span>تأكيد الطلب الآن (600 دج)</span>
                    <CheckCircle2 size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Success Confirmation State */
            <div className="capcut-notion-success">
              <div className="capcut-notion-success-icon">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="capcut-notion-success-title">شكراً لك! تم تسجيل طلبك بنجاح</h3>
              <p className="capcut-notion-success-desc">
                لقد استلمنا معلوماتك بنجاح. سيقوم فريق العمل بالتحقق من الدفع وتفعيل حساب CapCut Pro الخاص بك وإرسال بيانات الدخول إلى بريدك الإلكتروني ورقم هاتفك <strong>{PLACEHOLDERS.ACTIVATION_TIME}</strong>.
              </p>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="capcut-notion-footer">
          <div>CodeIt — منصة الاشتراكات والحلول الرقمية في الجزائر</div>
          <div style={{ marginTop: '4px' }}>
            جميع الحقوق محفوظة © {new Date().getFullYear()} • CodeIt 
          </div>
        </footer>

        {/* Mobile Sticky Quick Action Bar */}
        <div className="capcut-notion-sticky-bar">
          <div className="capcut-notion-sticky-info">
            <div className="capcut-notion-sticky-label">CapCut Pro</div>
            <div className="capcut-notion-sticky-price">600 دج / شهر</div>
          </div>
          <button type="button" onClick={scrollToForm} className="capcut-notion-sticky-btn">
            اطلب الآن
          </button>
        </div>

      </div>
    </div>
  );
}
