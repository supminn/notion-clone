import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { CardDescription, CardTitle } from "../ui/card";

type CardHeaderAsPropProps = {
  name: string;
  index: number;
};

type CardContentAsPropProps = {
  message: string;
};

export const CardHeaderAsProp: React.FC<CardHeaderAsPropProps> = ({
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

export const CardContentAsProp: React.FC<CardContentAsPropProps> = ({
  message,
}) => {
  return <p className="dark:text-washed-purple-800">{message}</p>;
};
