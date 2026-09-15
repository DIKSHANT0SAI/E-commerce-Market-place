import React from "react";

const NewsLetter = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-2 pt-8 pb-14">
      <h1 className="md:text-4xl text-2xl font-medium">
        Subscribe now & get 20% off
      </h1>
      <p className="md:text-base text-gray-500/80 pb-8">
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry.
      </p>
      {/* Not wired to a backend yet — disabled rather than silently doing nothing
          when clicked. Remove the `disabled` props once a subscribe endpoint exists. */}
      <div className="flex items-center justify-between max-w-2xl w-full md:h-14 h-12">
        <input
          className="border border-gray-500/30 rounded-md h-full border-r-0 outline-none w-full rounded-r-none px-3 text-gray-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
          type="email"
          placeholder="Enter your email id"
          disabled
        />
        <button
          className="md:px-12 px-8 h-full text-white bg-gray-400 rounded-md rounded-l-none cursor-not-allowed whitespace-nowrap"
          disabled
        >
          Coming soon
        </button>
      </div>
    </div>
  );
};

export default NewsLetter;
