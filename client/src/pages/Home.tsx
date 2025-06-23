import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { RecyclingBanner } from "@/components/RecyclingBanner";
import { ActionButtons } from "@/components/ActionButtons";
import { MapCallToAction } from "@/components/MapCallToAction";
import { FooterNavigation } from "@/components/FooterNavigation";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const [userName, setUserName] = useState("usuário");

  // Buscar nome do usuário do localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("recycleczs_current_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.name) {
          setUserName(parsedUser.name.split(' ')[0]); // Usar só o primeiro nome
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
      }
    }
  }, []);

  // Navigation handlers
  const handleRecyclingGuideClick = () => {
    console.log("Navigate to recycling guide");
    // setLocation("/recycling-guide");
  };

  const handleCollectionPointsClick = () => {
    console.log("Navigate to collection points");
    setLocation("/map");
  };

  const handleFindCollectorsClick = () => {
    console.log("Navigate to find collectors");
    setLocation("/search");
  };

  const handleRecyclableItemsClick = () => {
    console.log("Navigate to recyclable items");
    setLocation("/recycle");
  };

  const handleScheduledCollectionsClick = () => {
    console.log("Navigate to scheduled collections");
    setLocation("/schedule");
  };

  const handleMapButtonClick = () => {
    console.log("Navigate to map");
    setLocation("/map");
  };

  return (
    <div className="font-sans bg-white text-[#333333] min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 px-5 pb-16">
        {/* Greeting Section */}
        <h1 className="text-xl font-medium mb-4">Olá, {userName}</h1>

        <RecyclingBanner onRecyclingGuideClick={handleRecyclingGuideClick} />

        <ActionButtons
          onCollectionPointsClick={handleCollectionPointsClick}
          onFindCollectorsClick={handleFindCollectorsClick}
          onRecyclableItemsClick={handleRecyclableItemsClick}
          onScheduledCollectionsClick={handleScheduledCollectionsClick}
        />

        <MapCallToAction onMapButtonClick={handleMapButtonClick} />
      </main>

      <FooterNavigation />
    </div>
  );
}
