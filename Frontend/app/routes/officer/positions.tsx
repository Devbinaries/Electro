// import DashboardLayout from "~/components/layout/DashboardLayout";
// import { Plus } from "lucide-react";

// export default function PositionsPage() {
//   const positions = [
//     "President",
//     "Vice President",
//     "Secretary",
//     "Treasurer",
//   ];

//   return (
//     <DashboardLayout>
//       <div className="space-y-6">
//         <div className="flex items-center justify-between">
//           <h1 className="text-3xl font-bold">
//             Positions
//           </h1>

//           <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-white">
//             <Plus size={18} />
//             Add Position
//           </button>
//         </div>

//         <div className="grid gap-4">
//           {positions.map((position) => (
//             <div
//               key={position}
//               className="rounded-xl bg-white p-5 shadow"
//             >
//               {position}
//             </div>
//           ))}
//         </div>
//       </div>
//     </DashboardLayout>
//   );
// }