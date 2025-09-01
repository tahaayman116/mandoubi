import React, { useState, useMemo } from 'react';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// دالة لتنسيق الأرقام بالعربية مع الفواصل
const formatArabicNumber = (num) => {
  // التحقق من وجود الرقم وأنه صالح
  if (num === undefined || num === null || isNaN(num)) {
    return '0';
  }
  // تحويل الرقم لنص مع فواصل باللغة العربية
  return Number(num).toLocaleString('ar-EG');
};

function AdminDashboard() {
  const { representatives, addRepresentative, updateRepresentative, deleteRepresentative, submissions } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRep, setNewRep] = useState({ username: '', password: '', name: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  const handleAddRepresentative = (e) => {
    e.preventDefault();
    if (newRep.username && newRep.password && newRep.name) {
      addRepresentative(newRep);
      setNewRep({ username: '', password: '', name: '' });
      setShowAddForm(false);
    }
  };

  const toggleRepresentativeStatus = (id) => {
    const rep = representatives.find(r => r.id === id);
    updateRepresentative(id, { active: !rep.active });
  };

  const totalStats = useMemo(() => {
    const today = new Date();
    const thisMonth = submissions.filter(sub => {
      const subDate = new Date(sub.submittedAt);
      return subDate.getMonth() === today.getMonth() && subDate.getFullYear() === today.getFullYear();
    });
    
    // حساب إجمالي الأشخاص من جميع الإرسالات
    const totalPeople = submissions.reduce((sum, sub) => sum + (parseInt(sub.totalPeople) || 0), 0);
    
    // حساب إجمالي المستلمين من جميع الإرسالات
    const totalReceived = submissions.reduce((sum, sub) => sum + (parseInt(sub.receivedMoney) || 0), 0);
    
    // حساب عدم المستلمين
    const notReceived = totalPeople - totalReceived;
    
    // حساب عدد القرى الفريدة
    const uniqueVillages = new Set(submissions.map(sub => sub.villageName)).size;
    
    return {
      totalPeople: totalPeople,
      totalReceived: totalReceived,
      notReceived: notReceived,
      totalAmount: submissions.reduce((sum, sub) => sum + (parseFloat(sub.totalAmount) || 0), 0),
      totalVillages: uniqueVillages,
      monthlyPeople: thisMonth.reduce((sum, sub) => sum + (parseInt(sub.totalPeople) || 0), 0),
      monthlyAmount: thisMonth.reduce((sum, sub) => sum + (parseFloat(sub.totalAmount) || 0), 0),
      averagePerVillage: uniqueVillages > 0 ? Math.round(totalPeople / uniqueVillages) : 0,
      completionRate: totalPeople > 0 ? Math.round((totalReceived / totalPeople) * 100) : 0,
      activeReps: representatives.filter(rep => rep.active).length
    };
  }, [submissions, representatives]);

  const chartData = submissions.map(sub => ({
    name: sub.villageName,
    people: sub.totalPeople,
    received: sub.receivedMoney,
    amount: sub.totalAmount
  }));

  const pieData = [
    { name: 'مستلمين', value: totalStats.totalReceived, color: '#22c55e' },
    { name: 'غير مستلمين', value: totalStats.notReceived, color: '#ef4444' }
  ];

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      const matchesSearch = searchTerm === '' || 
        sub.villageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.submittedBy.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (dateFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        return matchesSearch && sub.submittedAt.split('T')[0] === today;
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return matchesSearch && new Date(sub.submittedAt) >= weekAgo;
      }
      
      return matchesSearch;
    });
  }, [submissions, searchTerm, dateFilter]);

  const exportToCSV = () => {
    const headers = ['القرية', 'العدد الكلي', 'المستلمين', 'غير المستلمين', 'المبلغ الإجمالي', 'المندوب', 'التاريخ'];
    const csvContent = [
      headers.join(','),
      ...filteredSubmissions.map(sub => [
        sub.villageName,
        sub.totalPeople,
        sub.receivedMoney,
        sub.notReceived,
        sub.totalAmount,
        sub.submittedBy,
        new Date(sub.submittedAt).toLocaleDateString('ar-EG')
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `campaign_data_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Professional Header */}
      <div className="mb-8 bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">🎯 لوحة التحكم الرئيسية</h1>
            <p className="text-primary-100">مراقبة شاملة لأداء الحملة الانتخابية</p>
          </div>
          <div className="mt-4 md:mt-0 text-center">
            <div className="text-3xl font-bold">{formatArabicNumber(totalStats.totalVillages)}</div>
            <div className="text-primary-200 text-sm">قرية مسجلة</div>
          </div>
        </div>
      </div>

      {/* Professional Tabs */}
      <div className="mb-8">
        <nav className="flex space-x-1 space-x-reverse bg-gray-100 p-1 rounded-lg shadow-inner">
          {[
            { id: 'overview', label: '📊 نظرة عامة' },
            { id: 'representatives', label: '👥 إدارة المندوبين' },
            { id: 'reports', label: '📈 التقارير' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-primary-600 shadow-md transform scale-105'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Enhanced KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">👥 إجمالي الأشخاص</p>
                  <p className="text-3xl font-bold mt-2">{formatArabicNumber(totalStats.totalPeople)}</p>
                  <p className="text-blue-200 text-xs mt-1">في {formatArabicNumber(totalStats.totalVillages)} قرية</p>
                </div>
                <div className="bg-blue-400 bg-opacity-30 rounded-full p-3">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 via-green-600 to-green-700 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">✅ المستلمين</p>
                  <p className="text-3xl font-bold mt-2">{formatArabicNumber(totalStats.totalReceived)}</p>
                  <p className="text-green-200 text-xs mt-1">من إجمالي {formatArabicNumber(totalStats.totalPeople)} شخص</p>
                </div>
                <div className="bg-green-400 bg-opacity-30 rounded-full p-3">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">💰 إجمالي المبلغ</p>
                  <p className="text-3xl font-bold mt-2">{formatArabicNumber(totalStats.totalAmount)} ج</p>
                  <p className="text-purple-200 text-xs mt-1">إجمالي المبالغ المدفوعة</p>
                </div>
                <div className="bg-purple-400 bg-opacity-30 rounded-full p-3">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">❌ غير المستلمين</p>
                  <p className="text-3xl font-bold mt-2">{formatArabicNumber(totalStats.notReceived)}</p>
                  <p className="text-orange-200 text-xs mt-1">لم يستلموا المساعدات</p>
                </div>
                <div className="bg-orange-400 bg-opacity-30 rounded-full p-3">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card shadow-lg border-t-4 border-t-primary-500">
              <h3 className="text-xl font-bold mb-6 text-gray-900">📊 إحصائيات القرى</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData.sort((a, b) => b.people - a.people).slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="name" stroke="#64748b"/>
                  <YAxis stroke="#64748b"/>
                  <Tooltip />
                  <Bar dataKey="people" fill="#3b82f6" radius={[4, 4, 0, 0]} name="إجمالي الأشخاص"/>
                  <Bar dataKey="received" fill="#22c55e" radius={[4, 4, 0, 0]} name="المستلمين"/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card shadow-lg border-t-4 border-t-green-500">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">🎯 نسبة الإنجاز</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {pieData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full ml-2" style={{backgroundColor: item.color}}></div>
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold">{formatArabicNumber(item.value)}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Representatives Tab */}
      {activeTab === 'representatives' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-2xl font-bold text-gray-900">👥 إدارة المندوبين</h2>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary flex items-center gap-2 shadow-lg"
            >
              ➕ إضافة مندوب جديد
            </button>
          </div>

          {showAddForm && (
            <div className="card shadow-lg border-l-4 border-l-primary-500">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">➕ إضافة مندوب جديد</h3>
              <form onSubmit={handleAddRepresentative} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="اسم المستخدم"
                  value={newRep.username}
                  onChange={(e) => setNewRep({...newRep, username: e.target.value})}
                  className="input-field"
                  required
                />
                <input
                  type="password"
                  placeholder="كلمة المرور"
                  value={newRep.password}
                  onChange={(e) => setNewRep({...newRep, password: e.target.value})}
                  className="input-field"
                  required
                />
                <input
                  type="text"
                  placeholder="الاسم الكامل"
                  value={newRep.name}
                  onChange={(e) => setNewRep({...newRep, name: e.target.value})}
                  className="input-field"
                  required
                />
                <div className="md:col-span-3 flex space-x-2 space-x-reverse">
                  <button type="submit" className="btn-primary">إضافة</button>
                  <button 
                    type="button" 
                    onClick={() => setShowAddForm(false)}
                    className="btn-secondary"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="card shadow-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                      👤 الاسم
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                      🔑 اسم المستخدم
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                      📊 الحالة
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                      ⚙️ الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {representatives.map((rep) => (
                    <tr key={rep.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {rep.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rep.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          rep.active 
                            ? 'bg-success-100 text-success-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {rep.active ? '✅ نشط' : '❌ غير نشط'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 space-x-reverse">
                        <button
                          onClick={() => toggleRepresentativeStatus(rep.id)}
                          className={`${rep.active ? 'btn-secondary' : 'btn-primary'} text-xs`}
                        >
                          {rep.active ? 'إيقاف' : 'تفعيل'}
                        </button>
                        <button
                          onClick={() => deleteRepresentative(rep.id)}
                          className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 rounded text-xs transition-colors duration-200"
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-2xl font-bold text-gray-900">📈 تقارير مفصلة</h2>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                placeholder="🔍 البحث في القرى أو المندوبين..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field md:w-64"
              />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="input-field md:w-32"
              >
                <option value="all">كل الفترات</option>
                <option value="today">اليوم</option>
                <option value="week">هذا الأسبوع</option>
              </select>
              <button
                onClick={exportToCSV}
                className="btn-primary whitespace-nowrap flex items-center gap-2 shadow-lg"
              >
                📥 تصدير Excel
              </button>
            </div>
          </div>
          
          <div className="card shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">📋 بيانات الإرسالات</h3>
              <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                {formatArabicNumber(filteredSubmissions.length)} نتيجة
              </span>
            </div>
            
            {filteredSubmissions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                        🏘️ القرية
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                        👥 العدد الكلي
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                        ✅ المستلمين
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                        💰 المبلغ الإجمالي
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                        👤 المندوب
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                        📅 التاريخ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSubmissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {submission.villageName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatArabicNumber(submission.totalPeople)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatArabicNumber(submission.receivedMoney)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatArabicNumber(submission.totalAmount)} ج
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {submission.submittedBy}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(submission.submittedAt).toLocaleDateString('ar-EG')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد بيانات</h3>
                <p className="mt-1 text-sm text-gray-500">لم يتم العثور على بيانات تطابق معايير البحث</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
