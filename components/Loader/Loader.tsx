import React from "react"

const Loader = () => {
  return (
    <div className="flex w-full content-start justify-center" style={{ flex: 1, width: "100%", minHeight: 800 }}>
      <div className="animate-pulse flex-col content-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          version="1.1"
          id="Layer_1"
          x="0px"
          y="0px"
          viewBox="0 0 277.04 260.26"
          className="w-15 ml-3"
        >
          <g>
            <g>
              <path
                className="st1"
                fill="#51BE99"
                d="M163.44,31.65c0,14.76-27.67,100.56-27.67,100.56s-27.67-85.8-27.67-100.56S120.48,0,135.77,0    S163.44,16.9,163.44,31.65z"
              />
              <path
                className="st1"
                fill="#51BE99"
                d="M39.69,80.85c14.03,4.56,87.09,57.39,87.09,57.39s-90.15-0.2-104.19-4.76s-26.27-21.56-21.55-36.1    S25.65,76.29,39.69,80.85z"
              />
              <path
                className="st1"
                fill="#51BE99"
                d="M48.24,213.75c8.67-11.94,81.5-65.09,81.5-65.09s-28.05,85.68-36.72,97.62s-28.63,18.32-40.99,9.34    C39.66,246.64,39.56,225.69,48.24,213.75z"
              />
              <path
                className="st1"
                fill="#51BE99"
                d="M177.28,246.69c-8.67-11.94-36.72-97.62-36.72-97.62s72.82,53.15,81.5,65.09    c8.67,11.94,8.58,32.89-3.78,41.87C205.91,265.01,185.95,258.63,177.28,246.69z"
              />
              <path
                className="st1"
                fill="#51BE99"
                d="M248.47,134.14c-14.03,4.56-104.19,4.76-104.19,4.76s73.05-52.83,87.09-57.39c14.03-4.56,33.93,2,38.65,16.54    S262.51,129.58,248.47,134.14z"
              />
            </g>
            <circle className="st1" fill="#51BE99" cx="189.46" cy="67.37" r="11.03" />
            <circle className="st1" fill="#51BE99" cx="81.92" cy="67.84" r="11.03" />
            <circle className="st1" fill="#51BE99" cx="61.16" cy="164.03" r="11.03" />
            <circle className="st1" fill="#51BE99" cx="135.08" cy="212.31" r="11.03" />
            <circle className="st1" fill="#51BE99" cx="209.77" cy="164.85" r="11.03" />
          </g>
        </svg>
        <h1 className="mt-5 text-center font-mono text-2xl font-black text-[#003C30]">Tazama Demo</h1>
        <p className="mb-5 text-center font-mono text-lg text-gray-500">Loading</p>
      </div>
    </div>
  )
}

export default Loader
