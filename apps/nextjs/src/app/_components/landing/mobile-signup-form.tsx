"use client";

import { useState } from "react";

import { Button } from "@sassy/ui/button";
import { Input } from "@sassy/ui/input";

const INIT = "INIT";
const SUBMITTING = "SUBMITTING";
const ERROR = "ERROR";
const SUCCESS = "SUCCESS";
const formStates = [INIT, SUBMITTING, ERROR, SUCCESS] as const;

const formStyles = {
  id: "cmd5jxpdc39iruk0i4kicbx3g",
  name: "Default",
  formStyle: "buttonBelow" as "buttonBelow" | "inline",
  placeholderText: "you@engagekit.io",
  formFont: "Inter",
  formFontColor: "#000000",
  formFontSizePx: 14,
  buttonText:
    "On mobile? Send me install link via email (exclusive 50% discount)",
  buttonFont: "Inter",
  buttonFontColor: "#ffffff",
  buttonColor: "#f6339a",
  buttonFontSizePx: 14,
  successMessage:
    "Thanks! We will send you an email reminder in 1-hour to check out EngageKit",
  successFont: "Inter",
  successFontColor: "#000000",
  successFontSizePx: 14,
  userGroup: "remind-install-later",
} as const;

const domain = "app.loops.so";

type FormState = (typeof formStates)[number];

export function MobileSignupForm() {
  const [email, setEmail] = useState("");
  const [formState, setFormState] = useState<FormState>(INIT);
  const [errorMessage, setErrorMessage] = useState("");

  const resetForm = () => {
    setEmail("");
    setFormState(INIT);
    setErrorMessage("");
  };

  /**
   * Rate limit the number of submissions allowed
   * @returns {boolean} true if the form has been successfully submitted in the past minute
   */
  const hasRecentSubmission = () => {
    const time = new Date();
    const timestamp = time.valueOf();
    const previousTimestamp = localStorage.getItem("loops-form-timestamp");

    // Indicate if the last sign up was less than a minute ago
    if (
      previousTimestamp &&
      Number(previousTimestamp) + 60 * 1000 > timestamp
    ) {
      setFormState(ERROR);
      setErrorMessage("Too many signups, please try again in a little while");
      return true;
    }

    localStorage.setItem("loops-form-timestamp", timestamp.toString());
    return false;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    // Prevent the default form submission
    event.preventDefault();

    // boundary conditions for submission
    if (formState !== INIT) return;
    if (!isValidEmail(email)) {
      setFormState(ERROR);
      setErrorMessage("Please enter a valid email");
      return;
    }
    if (hasRecentSubmission()) return;
    setFormState(SUBMITTING);

    // build body
    const formBody = `userGroup=${encodeURIComponent(
      formStyles.userGroup,
    )}&email=${encodeURIComponent(email)}&mailingLists=`;

    // API request to add user to newsletter
    fetch(`https://${domain}/api/newsletter-form/${formStyles.id}`, {
      method: "POST",
      body: formBody,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
      .then((res: any) => [res.ok, res.json(), res])
      .then(([ok, dataPromise, res]) => {
        if (ok) {
          resetForm();
          setFormState(SUCCESS);
        } else {
          dataPromise.then((data: any) => {
            setFormState(ERROR);
            setErrorMessage(data.message || res.statusText);
            localStorage.setItem("loops-form-timestamp", "");
          });
        }
      })
      .catch((error) => {
        setFormState(ERROR);
        // check for cloudflare error
        if (error.message === "Failed to fetch") {
          setErrorMessage(
            "Too many signups, please try again in a little while",
          );
        } else if (error.message) {
          setErrorMessage(error.message);
        }
        localStorage.setItem("loops-form-timestamp", "");
      });
  };

  const isInline = formStyles.formStyle === "inline";

  switch (formState) {
    case SUCCESS:
      return (
        <div className="flex w-full items-center justify-center">
          <p
            className="text-center"
            style={{
              fontFamily: `'${formStyles.successFont}', sans-serif`,
              color: formStyles.successFontColor,
              fontSize: `${formStyles.successFontSizePx}px`,
            }}
          >
            {formStyles.successMessage}
          </p>
        </div>
      );
    case ERROR:
      return (
        <div className="w-full">
          <SignUpFormError />
          <BackButton />
        </div>
      );
    default:
      return (
        <form
          onSubmit={handleSubmit}
          className={`flex w-full items-center justify-center ${
            isInline ? "flex-row" : "flex-col"
          }`}
        >
          <Input
            type="email"
            name="email"
            placeholder={formStyles.placeholderText}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={`w-full max-w-[300px] ${
              isInline ? "mr-2" : "mb-2"
            } h-auto min-h-[44px] rounded-md border border-gray-300 bg-white px-3 py-3 shadow-sm`}
            style={{
              color: formStyles.formFontColor,
              fontFamily: `'${formStyles.formFont}', sans-serif`,
              fontSize: `${formStyles.formFontSizePx}px`,
            }}
          />
          <div aria-hidden="true" className="absolute left-[-2024px]">
            {/* Honeypot field */}
          </div>
          <SignUpFormButton />
        </form>
      );
  }

  function SignUpFormError() {
    return (
      <div className="flex w-full items-center justify-center">
        <p className="text-center text-sm text-red-700">
          {errorMessage || "Oops! Something went wrong, please try again"}
        </p>
      </div>
    );
  }

  function BackButton() {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <button
        className="mx-auto mt-2 block cursor-pointer border-none bg-transparent text-center text-sm text-gray-500"
        style={{
          textDecoration: isHovered ? "underline" : "none",
        }}
        onMouseOut={() => setIsHovered(false)}
        onMouseOver={() => setIsHovered(true)}
        onClick={resetForm}
      >
        ← Back
      </button>
    );
  }

  function SignUpFormButton() {
    return (
      <Button
        type="submit"
        className={`${
          isInline ? "w-min" : "w-full"
        } max-w-[300px] cursor-pointer rounded-md border-2 border-black bg-pink-500 px-4 py-3 text-center leading-tight font-bold text-white shadow-[4px_4px_0px_#000] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none`}
        style={{
          fontSize: `${formStyles.buttonFontSizePx}px`,
          fontFamily: `'${formStyles.buttonFont}', sans-serif`,
          height: "auto",
          minHeight: "50px",
          whiteSpace: "normal",
          wordWrap: "break-word",
        }}
      >
        {formState === SUBMITTING ? "Please wait..." : formStyles.buttonText}
      </Button>
    );
  }
}

function isValidEmail(email: string) {
  return /.+@.+/.test(email);
}
