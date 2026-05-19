import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Proposal from "./pages/Proposal";
import ConsumerProposal from "./pages/ConsumerProposal";
import FranchiseProposal from "./pages/FranchiseProposal";
import Simulator from "./pages/Simulator";
import Apply from "./pages/Apply";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/proposal"} component={Proposal} />
      <Route path={"/proposal/consumer"} component={ConsumerProposal} />
      <Route path={"/proposal/franchise"} component={FranchiseProposal} />
      <Route path={"/simulator"} component={Simulator} />
      <Route path={"/apply"} component={Apply} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
