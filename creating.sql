-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 18, 2025 at 01:32 AM
-- Server version: 10.4.20-MariaDB
-- PHP Version: 7.4.21

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `creating`
--

-- --------------------------------------------------------

--
-- Table structure for table `talento`
--

CREATE TABLE `talento` (
  `id` int(11) NOT NULL,
  `imagen` varchar(100) COLLATE utf8_spanish2_ci NOT NULL,
  `nombre` varchar(100) COLLATE utf8_spanish2_ci NOT NULL,
  `pais` varchar(100) COLLATE utf8_spanish2_ci NOT NULL,
  `imgbandera` varchar(100) COLLATE utf8_spanish2_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish2_ci;

--
-- Dumping data for table `talento`
--

INSERT INTO `talento` (`id`, `imagen`, `nombre`, `pais`, `imgbandera`) VALUES
(1, '/img/usuarios/3.jpg 	', 'alejandro carvajal', 'colombia', ''),
(2, '/img/usuarios/2.jpg 	', 'natalia de vargas', 'colombia', ''),
(3, '/img/usuarios/1.jpg', 'paula de carvajal', 'colombia', ''),
(4, '/img/usuarios/4.jpg 	', 'Alexandra Carvajal', 'United States', ''),
(5, '/img/usuarios/5.jpg 	', 'Juan Carlos Rubius', 'Germany', ''),
(6, '/img/usuarios/6.jpg 	', 'Frances farmer\r\n', 'Brazil', ''),
(7, '/img/usuarios/7.jpg 	', 'Liz Valderrama', 'Peru', ''),
(8, '/img/usuarios/8.jpg 	', 'Carolina Vazques', 'Colombia', ''),
(9, '/img/usuarios/9.jpg 	', 'Alexandro Carvallo', 'Argentina', ''),
(10, '/img/usuarios/10.jpg 	\r\n', '\r\nJulia Redis', 'Uruguay', ''),
(11, '/img/usuarios/11.jpg ', 'Paola Ortiz', 'Colombia', ''),
(12, '/img/usuarios/12.jpg ', 'Maria Zalerno', 'Colombia', ''),
(13, '/img/usuarios/13.jpg ', 'Fabian Ortiz', 'Ecuador', ''),
(14, '/img/usuarios/14.jpg ', 'Andrea Marentes', 'Colombia', ''),
(15, '/img/usuarios/15.jpg ', 'Robi Rosa', 'Puerto Rico', '');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `talento`
--
ALTER TABLE `talento`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `talento`
--
ALTER TABLE `talento`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
