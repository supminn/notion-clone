import TitleSection from "@/components/landingPage/TitleSection";
import Image from "next/image";
import React from "react";
import Banner from "../../../public/appBanner.png";
import Cal from "../../../public/cal.png";
import { Button } from "@/components/ui/Button";
import { CLIENTS, PRICING_CARDS, PRICING_PLANS, USERS } from "@/lib/contants";
import { randomUUID } from "crypto";
// twMerge: Utility function to efficiently merge Tailwind CSS classes in JS without style conflicts.
import { twMerge } from "tailwind-merge";
// clsx: Conditionally apply CSS classes based on certain conditions or arguments.
import clsx from "clsx";
import CustomCard from "@/components/landingPage/CustomCard";
// Components created by Supminn
import {
  TestimonialCardHeader,
  TestimonialCardContent,
  PricingCardHeader,
  PricingCardFooter,
  PricingCardContent,
} from "@/components/landingPage/CardDetailsAsProp";

const HomePage = () => {
  return (
    <>
      <section
        className="overflow-hidden 
        px-4 
        sm:px-6 
        mt-10 
        sm:flex 
        sm:flex-col 
        gap-4 
        md:justify-center 
        md:items-center"
      >
        <TitleSection
          pill="✨ Your Workspace, Perfected"
          title="All-In-One Collaboration and Productivity Platform"
        />
        <div
          className="bg-white 
          p-[2px] 
          mt-6 
          rounded-xl 
          bg-gradient-to-r 
          from-primary 
          to-brand-primaryBlue 
          sm:w-[300px]"
        >
          <Button
            variant="secondary"
            className=" w-full
            rounded-[10px]
            p-6
            text-2xl
            bg-background
          "
          >
            Get Cypress Free
          </Button>
        </div>
        <div
          className="md:mt-[-90px] 
          sm:w-full 
          w-[750px] 
          flex 
          justify-center 
          items-center 
          mt-[-40px] 
          relative 
          sm:ml-0 
          ml-[-50px]"
        >
          <Image src={Banner} alt="Application Banner" />
          <div
            className="absolute 
            bottom-0 
            top-[50%] 
            bg-gradient-to-t 
            dark:from-background 
            left-0 
            right-0 
            z-10"
          />
        </div>
      </section>
      <section className="relative">
        <div
          className="overflow-hidden 
          flex 
          after:content[''] 
          after:dark:from-brand-dark 
          after:to-transparent 
          after:from-background 
          after:bg-gradient-to-l 
          after:right-0 
          after:top-0 
          after:bottom-0 
          after:w-20 
          after:absolute
          after:z-10 
          before:content[''] 
          before:dark:from-brand-dark 
          before:to-transparent 
          before:from-background 
          before:bg-gradient-to-r 
          before:left-0 
          before:top-0 
          before:bottom-0 
          before:w-20
          before:z-10 
          before:absolute"
        >
          {/* Repeat the logo list twice */}
          {[...Array(2)].map((arr) => (
            <div
              key={arr}
              className="flex 
              flex-nowrap 
              animate-slide"
            >
              {CLIENTS.map((client) => (
                <div
                  key={client.alt}
                  className="relative 
                  w-[200px] 
                  m-20 
                  shrink-0 
                  flex items-center"
                >
                  <Image
                    src={client.logo}
                    alt={client.alt}
                    width={200}
                    className="object-contain max-w-none"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
      <section
        className="px-4
        flex
        justify-center
        items-center
        flex-col
        relative"
      >
        {/* The gradient glow on the next TileSection */}
        <div
          className="w-[30%]
          blur-[120px]
          rounded-full
          h-32
          absolute
        bg-brand-primaryPurple/50
          -z-10
          top-22"
        />
        <TitleSection
          title="Keep track of your meetings all in one place"
          subHeading="Capture your ideas, thoughts, and meeting notes in a structured and organized manner."
          pill="Features"
        />
        <div
          className="mt-10
          max-w-[450px]
          justify-center
          items-center
          relative
          sm:ml-0
          rounded-2xl
          border-8
          border-washed-blue-300
          border-opacity-10"
        >
          <Image src={Cal} alt="Banner" className="rounded-2xl" />
        </div>
      </section>
      <section className="relative">
        {/* Purple gradient background on Testimonials */}
        <div
          className="w-full
          blur-[120px]
          rounded-full
          h-32
          absolute
        bg-brand-primaryPurple/50
          -z-10
          top-56"
        />
        <div className="mt-20 px-4 sm:px-6 flex flex-col overflow-x-hidden overflow-visible">
          <TitleSection
            title="Trusted by all"
            subHeading="Join thousands of satisfied users who rely on our platform for their 
            personal and professional productivity needs."
            pill="Testimonials"
          />
          {[...Array(2)].map((arr, index) => (
            <div
              key={randomUUID()}
              className={twMerge(
                clsx(
                  "mt-10 flex flex-norwap gap-6 self-start animate-[slide_250s_linear_infinite]",
                  {
                    "flex-row-reverse": index === 1,
                    "animate-[slide_250s_linear_infinite_reverse]": index === 1,
                    "ml-[100vw]": index === 1,
                  }
                ),
                "hover:paused"
              )}
            >
              {USERS.map((testimonial, index) => (
                <CustomCard
                  key={testimonial.name}
                  className="w-[500px]
                  shrink-0
                  rounded-xl
                  dark:bg-gradient-to-t
                  dark:from-border
                  dark:to-background"
                  cardHeader={
                    <TestimonialCardHeader
                      name={testimonial.name}
                      index={index}
                    />
                  }
                  cardContent={
                    <TestimonialCardContent message={testimonial.message} />
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </section>
      <section
        className="mt-20
        px-4
        sm:px-6"
      >
        <TitleSection
          title="The Perfect Plan For You"
          subHeading="Experience all the benefits of our platform. Select a plan that suits your needs and take your productivity to new heights."
          pill="Pricing"
        />
        <div
          className="flex
          flex-col-reverse
          sm:flex-row
          gap-4
          justify-center
          sm:items-stretch
          items-center mt-10"
        >
          {PRICING_CARDS.map((card) => (
            <CustomCard
              key={card.planType}
              className={clsx(
                "w-[300px] rounded-2xl dark:bg-black/40 background-blur-3xl relative",
                {
                  "border-brand-primaryPurple/70":
                    card.planType === PRICING_PLANS.pro,
                }
              )}
              cardHeader={<PricingCardHeader planType={card.planType} />}
              cardContent={
                <PricingCardContent
                  description={card.description}
                  price={card.price}
                  planType={card.planType}
                />
              }
              cardFooter={
                <PricingCardFooter
                  highlightFeature={card.highlightFeature}
                  features={card.features}
                />
              }
            />
          ))}
        </div>
      </section>
    </>
  );
};

export default HomePage;
