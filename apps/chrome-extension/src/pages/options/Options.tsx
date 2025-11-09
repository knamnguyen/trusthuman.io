import { Route, Switch } from "wouter";

import "../../assets/styles/tailwind.css";

import { ProfileOptionsPage } from "./routes/profile";

export default function Options() {
  return (
    <Switch>
      <Route path="/" component={ProfileOptionsPage} />

      {/* TODO */}
      <Route path="/autocomment" component={() => null} />
    </Switch>
  );
}
