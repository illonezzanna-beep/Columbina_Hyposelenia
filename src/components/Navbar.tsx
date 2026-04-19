import React from 'react';
import { Heart, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  const navItems = [
    { id: 'features', label: '核心功能' },
    { id: 'piano', label: '情绪钢琴' },
    { id: 'workflow', label: '工作原理' },
    { id: 'privacy', label: '隐私安全' },
    { id: 'contact', label: '联系我们' },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Heart className="w-6 h-6 text-white fill-current" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-gray-900">
              情绪光语站
            </span>
          </div>
          
          <div className="hidden md:flex space-x-10">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors"
              >
                {item.label}
              </button>
            ))}
            <button className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
              预约演示
            </button>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-gray-600">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 p-4 space-y-4 shadow-xl">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="block w-full text-left px-4 py-3 text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all"
            >
              {item.label}
            </button>
          ))}
          <button className="w-full px-4 py-4 bg-indigo-600 text-white font-bold rounded-xl">
            预约演示
          </button>
        </div>
      )}
    </nav>
  );
};
