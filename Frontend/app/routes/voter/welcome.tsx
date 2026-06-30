import { useNavigate } from "react-router";

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-6 md:p-10">
        <h1 className="text-3xl md:text-5xl font-bold text-center text-slate-900 mb-6">
          Welcome to the 27th SRC Elections
        </h1>

        <p className="text-slate-600 text-sm md:text-base leading-relaxed text-center mb-8">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Mollitia
          dolorem quidem, quaerat tenetur maiores doloremque unde at eius nihil
          sapiente, sed porro veniam expedita magnam voluptatum corrupti
          exercitationem consequuntur quae tempore aliquam illum aspernatur,
          eaque iusto. Earum voluptas quas, beatae modi, veritatis delectus
          eveniet, tempora provident magnam excepturi dicta. Magnam sunt
          provident facilis neque, soluta rem sed nihil ipsa atque!
        </p>

        <h4 className="text-center text-slate-800 font-medium mb-6">
          Click the button to verify your eligibility
        </h4>

        <div className="flex justify-center">
          <button
            onClick={() => navigate("/voter/verify")}
            className="cursor-pointer w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors duration-200"
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