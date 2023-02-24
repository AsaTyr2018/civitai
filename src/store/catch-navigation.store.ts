import Router from 'next/router';
import { useEffect } from 'react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

type Handler = {
  name: string;
  message?: string;
  predicate: boolean | (() => boolean);
  event?: 'beforeunload' | 'routeChangeStart';
};
type StoreState = {
  handlers: Handler[];
  register: ({ name, message, predicate, event }: Handler) => void;
  deregister: (name: string) => void;
};

export const useCatchNavigationStore = create<StoreState>()(
  immer((set, get) => ({
    handlers: [],
    register: ({ name, message, predicate, event }) => {
      set((state) => {
        const index = get().handlers.findIndex((x) => x.name === name);
        if (index === -1) state.handlers.push({ name, message, predicate, event });
        else {
          state.handlers[index].message = message;
          state.handlers[index].predicate = predicate;
        }
      });
    },
    deregister: (name) => {
      set((state) => {
        state.handlers = state.handlers.filter((x) => x.name !== name);
      });
    },
  }))
);

export const useCatchNavigation = ({ name, message, predicate, event }: Handler) => {
  const register = useCatchNavigationStore((state) => state.register);
  const deregister = useCatchNavigationStore((state) => state.deregister);

  useEffect(() => {
    register({ name, message, predicate, event });
    return () => {
      deregister(name);
    };
  }, [register, deregister, name, message, predicate, event]);
};

// export const useRegisterCatchNavigation = (args?: { message?: string }) => {
//   const { message = 'All unsaved changes will be lost. Are you sure you want to exit?' } =
//     args ?? {};
//   // start processing your handlers with a first-in first-out approach
//   const handlers = useCatchNavigationStore((state) => state.handlers);
//   const reversed = handlers.reverse();
//   console.log({ reversed });

//   useEffect(() => {
//     function handleBeforeUnload(event: BeforeUnloadEvent) {
//       const index = reversed
//         .filter((x) => x.event !== 'routeChangeStart')
//         .findIndex((x) => (typeof x.predicate === 'function' ? x.predicate() : x.predicate));
//       if (index === -1) return;
//       event.preventDefault();
//       return (event.returnValue = reversed[index].message ?? message);
//     }

//     function handleRouteChangeStart() {
//       const index = reversed
//         .filter((x) => x.event !== 'beforeunload')
//         .findIndex((x) => (typeof x.predicate === 'function' ? x.predicate() : x.predicate));
//       if (index === -1) return;
//       if (window.confirm(reversed[index].message ?? message)) return;

//       // Push state, because browser back action changes link and changes history state
//       // but we stay on the same page
//       if (Router.asPath !== window.location.pathname) {
//         window.history.pushState('', '', Router.asPath);
//       }

//       // Throw to prevent navigation
//       throw 'routeChange aborted.';
//     }

//     window.addEventListener('beforeunload', handleBeforeUnload);
//     Router.events.on('routeChangeStart', handleRouteChangeStart);
//     return () => {
//       window.removeEventListener('beforeunload', handleBeforeUnload);
//       Router.events.off('routeChangeStart', handleRouteChangeStart);
//     };
//   }, [reversed, message]);
// };

/** use to register navigation event listeners to prevent users from navigating while changes are being saved */
export const RegisterCatchNavigation = ({
  message = 'All unsaved changes will be lost. Are you sure you want to exit?',
}: {
  message?: string;
}) => {
  // start processing your handlers with a first-in first-out approach
  const handlers = useCatchNavigationStore((state) => state.handlers);
  console.log({ handlers });

  useEffect(() => {
    const reversed = [...handlers].reverse();
    console.log({ reversed });
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      const index = reversed
        .filter((x) => x.event !== 'routeChangeStart')
        .findIndex((x) => (typeof x.predicate === 'function' ? x.predicate() : x.predicate));
      if (index === -1) return;
      event.preventDefault();
      return (event.returnValue = reversed[index].message ?? message);
    }

    function handleRouteChangeStart() {
      const index = reversed
        .filter((x) => x.event !== 'beforeunload')
        .findIndex((x) => (typeof x.predicate === 'function' ? x.predicate() : x.predicate));
      if (index === -1) return;
      if (window.confirm(reversed[index].message ?? message)) return;

      // Push state, because browser back action changes link and changes history state
      // but we stay on the same page
      if (Router.asPath !== window.location.pathname) {
        window.history.pushState('', '', Router.asPath);
      }

      // Throw to prevent navigation
      throw 'routeChange aborted.';
    }

    if (reversed.length > 0) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      Router.events.on('routeChangeStart', handleRouteChangeStart);
    } else {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      Router.events.off('routeChangeStart', handleRouteChangeStart);
    }
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      Router.events.off('routeChangeStart', handleRouteChangeStart);
    };
  }, [handlers, message]);

  return null;
};
