import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { CardContent, CardDescription, CardTitle } from "../ui/card";
import { PRICING_PLANS } from "@/lib/contants";
import Diamond from "../../../public/icons/diamond.svg";
import Check from "../../../public/icons/check.svg";
import Image from "next/image";
import { Button } from "../ui/button";

type TestimonalCardHeaderProps = {
  name: string;
  index: number;
};

export const TestimonialCardHeader: React.FC<TestimonalCardHeaderProps> = ({
  name,
  index,
}) => {
  return (
    <div className="flex items-center gap-4">
      <Avatar>
        <AvatarImage src={`/avatars/${index + 1}.png`} />
        <AvatarFallback>AV</AvatarFallback>
      </Avatar>
      <div>
        <CardTitle className="text-foreground">{name}</CardTitle>
        <CardDescription className="dark:text-washed-purple-800">
          {name.toLowerCase()}
        </CardDescription>
      </div>
    </div>
  );
};

type TestimonialCardContentProps = {
  message: string;
};

export const TestimonialCardContent: React.FC<TestimonialCardContentProps> = ({
  message,
}) => {
  return <p className="dark:text-washed-purple-800">{message}</p>;
};

export const PricingCardHeader = ({ planType }: { planType: string }) => {
  return (
    <CardTitle className="text-2xl font-semibold">
      {planType === PRICING_PLANS.pro && (
        <>
          <div
            className="hidden
            dark:block
            w-full
            blur-[120px]
            rounded-full
            h-32
            absolute
            bg-brand-primaryPurple/80
            -z-10
            top-0"
          />
          <Image
            src={Diamond}
            alt="Pro Plan Icon"
            className="absolute top-6 right-6"
          />
        </>
      )}
      {planType}
    </CardTitle>
  );
};

type PricingCardContentProps = {
  price: string;
  description: string;
  planType: string;
};

export const PricingCardContent = ({
  price,
  description,
  planType,
}: PricingCardContentProps) => {
  return (
    <CardContent className="p-0">
      <span className="font-normal text-2xl">${price}</span>
      {+price > 0 && (
        <span className="dark:text-washed-purple-800 ml-1">/mo</span>
      )}
      <p className="dark:text-washed-purple-800 text-sm">{description}</p>
      <Button variant="primary" className="whitespace-nowrap w-full mt-4">
        {planType === PRICING_PLANS.pro ? "Go Pro" : "Get Started"}
      </Button>
    </CardContent>
  );
};

type PricingCardFooterProps = {
  highlightFeature: string;
  features: string[];
};

export const PricingCardFooter: React.FC<PricingCardFooterProps> = ({
  highlightFeature,
  features,
}) => {
  return (
    <ul
      className="font-normal
      flex
      mb-2
      flex-col
      gap-4"
    >
      <small>{highlightFeature}</small>
      {features.map((feature) => (
        <li
          key={feature}
          className="flex
          items-center
          gap-2"
        >
          <Image src={Check} alt="Check Icon" />
          {feature}
        </li>
      ))}
    </ul>
  );
};
