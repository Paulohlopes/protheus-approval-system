const express = require('express');
const router = express.Router();
const WindowsInfoService = require('../services/windowsInfoService');

/**
 * @route GET /api/system/windows-user
 * @desc Captura informações do usuário Windows
 * @access Public
 */
router.get('/windows-user', async (req, res) => {
  try {
    const windowsInfo = WindowsInfoService.getCurrentWindowsUser();
    
    if (!windowsInfo) {
      return res.status(404).json({
        success: false,
        message: 'Não foi possível capturar informações do Windows'
      });
    }

    // Remover informações sensíveis antes de enviar
    const safeInfo = {
      username: windowsInfo.username,
      fullName: windowsInfo.fullName,
      email: windowsInfo.email,
      domain: windowsInfo.domain,
      computerName: windowsInfo.computerName,
      department: windowsInfo.department,
      title: windowsInfo.title
    };

    res.json({
      success: true,
      data: safeInfo
    });
  } catch (error) {
    console.error('Erro ao capturar informações do Windows:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao capturar informações do sistema'
    });
  }
});

/**
 * @route GET /api/system/suggested-settings
 * @desc Retorna configurações sugeridas baseadas no ambiente
 * @access Public
 */
router.get('/suggested-settings', async (req, res) => {
  try {
    const settings = WindowsInfoService.getSuggestedSettings();
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Erro ao gerar configurações sugeridas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar configurações'
    });
  }
});

/**
 * @route POST /api/system/validate-windows-user
 * @desc Valida se o usuário Windows corresponde ao Protheus
 * @access Public
 */
router.post('/validate-windows-user', async (req, res) => {
  try {
    const { protheusUsername } = req.body;
    const windowsInfo = WindowsInfoService.getCurrentWindowsUser();
    
    if (!windowsInfo) {
      return res.status(404).json({
        success: false,
        message: 'Não foi possível capturar informações do Windows'
      });
    }

    const isValid = WindowsInfoService.validateWindowsUser(
      windowsInfo.username,
      protheusUsername
    );

    res.json({
      success: true,
      data: {
        isValid,
        windowsUsername: windowsInfo.username,
        protheusUsername
      }
    });
  } catch (error) {
    console.error('Erro ao validar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao validar usuário'
    });
  }
});

module.exports = router;