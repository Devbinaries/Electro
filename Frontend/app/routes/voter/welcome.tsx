import { useNavigate } from "react-router";

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-3 py-6 sm:px-4 sm:py-8">
      <div className="w-full max-w-4xl rounded-2xl bg-white p-4 shadow-lg sm:p-6 md:p-10">
        <h1 className="mb-6 text-center text-2xl font-bold text-slate-900 sm:text-3xl md:text-5xl">
          Welcome to the 27th SRC Elections
        </h1>

        <p className="mb-8 text-center text-sm leading-relaxed text-slate-600 md:text-base">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Mollitia
          dolorem quidem, quaerat tenetur maiores doloremque unde at eius nihil
          sapiente, sed porro veniam expedita magnam voluptatum corrupti
          exercitationem consequuntur quae tempore aliquam illum aspernatur,
          eaque iusto. Earum voluptas quas, beatae modi, veritatis delectus
          eveniet, tempora provident magnam excepturi dicta. Magnam sunt
          provident facilis neque, soluta rem sed nihil ipsa atque!
        </p>

        <h4 className="mb-6 text-center font-medium text-slate-800">
          Click the button to verify your eligibility
        </h4>

        <div className="flex justify-center">
          <button
            onClick={() => navigate("/voter/verify")}
            className="w-full cursor-pointer rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white transition-colors duration-200 hover:bg-blue-700 sm:w-auto"
          >
            Proceed
          </button>
        </div>
      </div>

      <p className="mt-6 text-sm text-slate-500 text-center">
        Powered by Electro
      </p>
    </div>
  );
}
