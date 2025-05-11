import Link from 'next/link';
import { UserNav } from './UserNav';
import { currentUser } from '@clerk/nextjs';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle, // For consistent styling with Link
} from "@/components/ui/navigation-menu";

export default async function Header() {
  const user = await currentUser();
  return (
    <div className="container m-0 mx-auto py-6 md:py-8 md:px-10 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-50">
      <div className="max-w-screen-xl flex items-center justify-between mx-auto">
        {/* logo */}
        <Link className="flex w-fit items-center gap-[2px]" href="/dashboard">
          <img
            src="/logo.svg"
            width={50}
            height={50}
            alt="logo"
            className="h-5 w-5 md:h-8 md:w-8"
          />
          <h1 className="text-xl font-medium text-[#25292F] md:text-3xl">
            <span className="font-bold">A</span>gentic<span className="font-bold">N</span>otes
          </h1>
        </Link>
        {/* navigation links and buttons */}
        <div className="flex items-center gap-4 md:gap-6">
          {user ? (
            <>
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <Link href="/dashboard" legacyBehavior passHref>
                      <NavigationMenuLink className={navigationMenuTriggerStyle() + " hidden md:inline-flex lg:text-lg"}>
                        Dashboard
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link href="/features" legacyBehavior passHref>
                      <NavigationMenuLink className={navigationMenuTriggerStyle() + " hidden md:inline-flex lg:text-lg"}>
                        Features
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link href="/dashboard/action-items" legacyBehavior passHref>
                      <NavigationMenuLink className={navigationMenuTriggerStyle() + " hidden md:inline-flex lg:text-lg"}>
                        Action Items
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
              <UserNav
                image={user.imageUrl}
                name={user.firstName + ' ' + user.lastName}
                email={
                  user.emailAddresses.find(
                    ({ id }) => id === user.primaryEmailAddressId,
                  )!.emailAddress
                }
              />
            </>
          ) : (
            <>
              <Link
                href={'/features'}
                className="cursor-pointer text-md text-gray-700 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400 md:text-lg"
              >
                Features
              </Link>
              <Link href="/dashboard">
                <button className="text-md primary-gradient primary-shadow rounded-lg px-4 py-2 text-center text-light md:px-6 md:py-2 md:text-lg">
                  Sign in
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
