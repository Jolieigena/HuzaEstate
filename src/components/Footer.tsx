export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start mb-6 md:mb-0">
            <span className="text-2xl font-bold">HuzaEstate</span>
          </div>
          <div className="flex justify-center space-x-6 md:order-2">
            <span className="text-gray-400 hover:text-white">
              About
            </span>
            <span className="text-gray-400 hover:text-white">
              Contact
            </span>
            <span className="text-gray-400 hover:text-white">
              Terms
            </span>
            <span className="text-gray-400 hover:text-white">
              Privacy
            </span>
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} HuzaEstate, Inc. All rights reserved. (Rwanda)
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
