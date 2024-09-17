export function Debtor() {
  return (
    <div className="mb-2 p-2">
      <i className="fa-regular fa-pen-to-square fa-sm text-black"></i>
      <i className="fa-solid fa-user fa-2xl rounded-md border px-1 py-5"></i>

      <i className="fa-solid fa-file"></i>
      <i className="fa-solid fa-file"></i>

      <button
        data-modal-target="default-modal"
        data-modal-toggle="default-modal"
        className="fa-solid fa-circle-plus"
      ></button>
      <i className="fa-solid fa-atom"></i>
    </div>
  )
}
