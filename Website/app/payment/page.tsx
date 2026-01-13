"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import styles from "./page.module.css";

type PaymentMethod = "card" | "paypal" | null;
type CardType = "visa" | "mastercard" | "amex" | "discover" | null;

interface CardData {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
}

export default function PaymentPage() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [cardType, setCardType] = useState<CardType>(null);
  const [cardData, setCardData] = useState<CardData>({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const numberInputRef = useRef<HTMLInputElement>(null);
  const expiryInputRef = useRef<HTMLInputElement>(null);
  const cvvInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Detect card type from number
  useEffect(() => {
    const number = cardData.number.replace(/\s/g, "");
    if (number.startsWith("4")) {
      setCardType("visa");
    } else if (number.startsWith("5") || number.startsWith("2")) {
      setCardType("mastercard");
    } else if (number.startsWith("3")) {
      setCardType("amex");
    } else if (number.startsWith("6")) {
      setCardType("discover");
    } else {
      setCardType(null);
    }
  }, [cardData.number]);

  // Format card number
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "");
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(" ");
  };

  // Format expiry
  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    const cleaned = formatted.replace(/\s/g, "");
    if (cleaned.length <= 16) {
      setCardData({ ...cardData, number: formatted });
      // Auto-advance to expiry when card number is complete (16 digits)
      if (cleaned.length === 16) {
        setTimeout(() => expiryInputRef.current?.focus(), 100);
      }
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    const cleaned = formatted.replace(/\D/g, "");
    if (cleaned.length <= 4) {
      setCardData({ ...cardData, expiry: formatted });
      // Auto-advance to CVV when expiry is complete (MM/YY format = 5 chars)
      if (formatted.length === 5 && formatted.includes("/")) {
        setTimeout(() => cvvInputRef.current?.focus(), 100);
      }
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, "");
    if (cleaned.length <= 3) {
      setCardData({ ...cardData, cvv: cleaned });
      // Auto-advance to name when CVV is complete (3 digits)
      if (cleaned.length === 3) {
        setTimeout(() => nameInputRef.current?.focus(), 100);
      }
    }
  };

  const getCardIcon = () => {
    switch (cardType) {
      case "visa":
        return "VISA";
      case "mastercard":
        return "MC";
      case "amex":
        return "AMEX";
      case "discover":
        return "DISC";
      default:
        return "CARD";
    }
  };

  const getCardColor = () => {
    switch (cardType) {
      case "visa":
        return "from-blue-500/20 to-blue-700/20";
      case "mastercard":
        return "from-orange-500/20 to-red-500/20";
      case "amex":
        return "from-cyan-500/20 to-blue-500/20";
      case "discover":
        return "from-orange-500/20 to-orange-700/20";
      default:
        return "from-accent/20 to-accent/10";
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 25 }}
        className="mb-12"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors font-mono mb-8"
        >
          ← Back to Overview
        </Link>
        <h1 className="text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl lg:text-6xl font-mono mb-4">
          PAYMENT
        </h1>
        <p className="text-lg leading-relaxed text-text-secondary sm:text-xl max-w-3xl">
          Select your payment method and complete your purchase.
        </p>
      </motion.div>

      <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
        {/* Payment Method Selection */}
        <div className="order-1">
          <h2 className="text-2xl font-semibold text-text-primary font-mono mb-6">
            Payment Method
          </h2>
          <div className="space-y-4">
            {/* Card Option */}
            <motion.button
              onClick={() => setPaymentMethod("card")}
              className={`w-full system-card p-6 text-left ${
                paymentMethod === "card" ? "border-accent/50" : ""
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-gradient-to-br from-accent/30 to-accent/10 border-2 border-accent/40 flex items-center justify-center font-mono text-xs">
                    CARD
                  </div>
                  <div>
                    <div className="font-mono text-sm text-text-primary">Credit / Debit Card</div>
                    <div className="text-xs text-text-muted">Visa, Mastercard, Amex, Discover</div>
                  </div>
                </div>
                {paymentMethod === "card" && (
                  <div className="h-2 w-2 bg-accent rounded-full"></div>
                )}
              </div>
            </motion.button>

            {/* PayPal Option */}
            <motion.button
              onClick={() => setPaymentMethod("paypal")}
              className={`w-full system-card p-6 text-left ${
                paymentMethod === "paypal" ? "border-accent/50" : ""
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-gradient-to-br from-blue-500/30 to-blue-700/10 border-2 border-blue-500/40 flex items-center justify-center font-mono text-xs">
                    PP
                  </div>
                  <div>
                    <div className="font-mono text-sm text-text-primary">PayPal</div>
                    <div className="text-xs text-text-muted">Pay with your PayPal account</div>
                  </div>
                </div>
                {paymentMethod === "paypal" && (
                  <div className="h-2 w-2 bg-accent rounded-full"></div>
                )}
              </div>
            </motion.button>
          </div>
        </div>

        {/* Card Display / Form */}
        <div className="order-2">
          <AnimatePresence mode="wait">
            {paymentMethod === "card" && (
              <motion.div
                key="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Interactive Card */}
                <div className={styles.cardContainer}>
                  <div className={styles.cardFrontMinecraft}>
                    <div className={styles.cardHeader}>
                      <div className={styles.chipMinecraft}></div>
                      <div className={`${styles.cardLogo} ${getCardColor()}`}>
                        {getCardIcon()}
                      </div>
                    </div>
                    
                    {/* Editable Card Number */}
                    <div 
                      className={styles.cardNumberInput}
                      onClick={() => {
                        setFocusedField("number");
                        document.getElementById("card-number-input")?.focus();
                      }}
                    >
                      <input
                        ref={numberInputRef}
                        id="card-number-input"
                        type="text"
                        inputMode="numeric"
                        value={cardData.number}
                        onChange={handleCardNumberChange}
                        onFocus={() => setFocusedField("number")}
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                        autoComplete="cc-number"
                        className={styles.cardInput}
                      />
                    </div>
                    
                    <div className={styles.cardFooter}>
                      <div 
                        className={styles.cardExpiryInput}
                        onClick={() => {
                          setFocusedField("expiry");
                          document.getElementById("card-expiry-input")?.focus();
                        }}
                      >
                        <div className={styles.cardLabel}>VALID THRU</div>
                        <input
                          ref={expiryInputRef}
                          id="card-expiry-input"
                          type="text"
                          inputMode="numeric"
                          value={cardData.expiry}
                          onChange={handleExpiryChange}
                          onFocus={() => setFocusedField("expiry")}
                          placeholder="MM/YY"
                          maxLength={5}
                          autoComplete="cc-exp"
                          className={styles.cardInputSmall}
                        />
                      </div>
                      <div 
                        className={styles.cardCvvInput}
                        onClick={() => {
                          setFocusedField("cvv");
                          document.getElementById("card-cvv-input")?.focus();
                        }}
                      >
                        <div className={styles.cardLabel}>CVV</div>
                        <input
                          ref={cvvInputRef}
                          id="card-cvv-input"
                          type="text"
                          inputMode="numeric"
                          value={cardData.cvv}
                          onChange={handleCvvChange}
                          onFocus={() => setFocusedField("cvv")}
                          placeholder="***"
                          maxLength={3}
                          autoComplete="cc-csc"
                          className={styles.cardInputCvvFront}
                        />
                      </div>
                    </div>
                    
                    <div 
                      className={styles.cardNameInput}
                      onClick={() => {
                        setFocusedField("name");
                        document.getElementById("card-name-input")?.focus();
                      }}
                    >
                      <input
                        ref={nameInputRef}
                        id="card-name-input"
                        type="text"
                        value={cardData.name}
                        onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                        onFocus={() => setFocusedField("name")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            // Submit or blur when done
                            nameInputRef.current?.blur();
                          }
                        }}
                        placeholder="CARDHOLDER NAME"
                        autoComplete="cc-name"
                        className={styles.cardInputName}
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  className="w-full btn-primary py-3 mt-6"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="font-mono">PROCEED TO PAYMENT</span>
                </motion.button>
              </motion.div>
            )}

            {paymentMethod === "paypal" && (
              <motion.div
                key="paypal"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="system-card p-8 text-center"
              >
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500/30 to-blue-700/10 border-2 border-blue-500/40 flex items-center justify-center font-mono text-2xl">
                    PP
                  </div>
                  <h3 className="text-xl font-mono text-text-primary mb-2">PayPal Payment</h3>
                  <p className="text-sm text-text-secondary">
                    You will be redirected to PayPal to complete your payment securely.
                  </p>
                </div>
                <motion.button
                  className="w-full btn-primary py-3"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="font-mono">CONTINUE WITH PAYPAL</span>
                </motion.button>
              </motion.div>
            )}

            {!paymentMethod && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="system-card p-12 text-center"
              >
                <p className="text-text-muted font-mono">Select a payment method to continue</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
